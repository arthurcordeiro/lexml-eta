import { Articulacao, Artigo, Dispositivo } from '../model/dispositivo/dispositivo';
import { TEXTO_OMISSIS } from '../model/dispositivo/omissis';
import { isAgrupador, isArticulacao, isArtigo, isCaput, isDispositivoDeArtigo, isDispositivoGenerico, isIncisoCaput, TipoDispositivo } from '../model/dispositivo/tipo';
import { Elemento as Elemento, Referencia } from '../model/elemento';
import { buildListaElementosRenumerados, createElemento, getDispositivoFromElemento, getElementos, listaDispositivosRenumerados } from '../model/elemento/elemento-util';
import { acoesPossiveis } from '../model/lexml/acoes/acoes.possiveis';
import { hasIndicativoDesdobramento, TEXTO_DEFAULT_DISPOSITIVO_ALTERACAO } from '../model/lexml/conteudo/conteudo-util';
import { validaDispositivo } from '../model/lexml/dispositivo/dispositivo-validator';
import { DispositivoLexmlFactory } from '../model/lexml/factory/dispositivo-lexml-factory';
import {
  getArticulacao,
  getDispositivoAndFilhosAsLista,
  getDispositivoAnterior,
  getDispositivoAnteriorMesmoTipo,
  getUltimoFilho,
  hasFilhos,
  irmaosMesmoTipo,
  isArtigoUnico,
  isParagrafoUnico,
} from '../model/lexml/hierarquia/hierarquia-util';
import { addSpaceRegex, escapeRegex } from '../util/string-util';
import { adicionarElementoAction } from './elemento-actions';
import { Eventos, getEvento } from './eventos';
import { StateEvent, StateType } from './state';

const count = 0;

export const buildPast = (state: any, events: any): StateEvent[] => {
  const past = state.past ? state.past : [];
  past.push(JSON.parse(JSON.stringify(events)));

  return count > 50 ? past.shift() : past;
};

export const buildFuture = (state: any, events: any): StateEvent[] => {
  const future = state.future ? state.future : [];
  future.push(JSON.parse(JSON.stringify(events)));

  return count > 50 ? future.shift() : future;
};

export const textoFoiModificado = (atual: Dispositivo, action: any, state?: any): boolean => {
  if (state && state.ui?.events) {
    const ev = getEvento(state.ui.events, StateType.ElementoModificado);
    if (ev && ev.elementos && ev.elementos[0]?.conteudo?.texto === atual.texto) {
      return true;
    }
  }
  return (atual.texto !== '' && action.atual?.conteudo?.texto === '') || (action.atual?.conteudo?.texto && atual.texto.localeCompare(action.atual?.conteudo?.texto) !== 0);
};

export const isOrWasUnico = (atual: Dispositivo, originalmenteUnico: boolean): boolean => {
  return isArtigoUnico(atual) || originalmenteUnico;
};

export const isArticulacaoAlteracao = (articulacao: Articulacao): boolean => {
  return articulacao.pai !== undefined;
};

export const getArticulacaoFromElemento = (articulacao: Articulacao, elemento: Elemento | Referencia): Articulacao => {
  return !isElementoDispositivoAlteracao(elemento) || isArticulacaoAlteracao(articulacao)
    ? articulacao
    : getDispositivoFromElemento(articulacao!, { uuid: (elemento as Elemento).hierarquia!.pai!.uuidAlteracao })?.alteracoes ?? articulacao;
};

export const createElementoValidado = (dispositivo: Dispositivo): Elemento => {
  const el = createElemento(dispositivo);
  el.mensagens = validaDispositivo(dispositivo);

  return el;
};

export const criaElementoValidado = (validados: Elemento[], dispositivo: Dispositivo, incluiAcoes?: boolean): void => {
  const mensagens = validaDispositivo(dispositivo);

  if (mensagens.length > 0 || (dispositivo.mensagens && dispositivo.mensagens?.length > 0)) {
    dispositivo.mensagens = mensagens;
    const elemento = createElemento(dispositivo, incluiAcoes);
    elemento.mensagens = validaDispositivo(dispositivo);
    validados.push(elemento);
  }
};

export const hasIndicativoInicioAlteracao = (texto: string): boolean => {
  return (
    new RegExp(addSpaceRegex(escapeRegex('o seguinte acréscimo:')) + '\\s*$').test(texto) ||
    new RegExp(addSpaceRegex(escapeRegex('os seguintes acréscimos:')) + '\\s*$').test(texto) ||
    new RegExp(addSpaceRegex(escapeRegex('passa a vigorar com a seguinte alteração:')) + '\\s*$').test(texto) ||
    new RegExp(addSpaceRegex(escapeRegex('passa a vigorar com as seguintes alterações:')) + '\\s*$').test(texto)
  );
};

export const normalizaSeForOmissis = (texto: string): string => {
  if (/^[.]*(?:\s*)["”“]?(\s*)?\(NR\)\s*$/.test(texto)) {
    return TEXTO_DEFAULT_DISPOSITIVO_ALTERACAO;
  }

  if (/["”]?(\s*)?\(NR\)?\s*$/.test(texto)) {
    return texto.replace(/["“](?!.*["”])/, '”');
  }

  if (texto === TEXTO_OMISSIS || texto === TEXTO_DEFAULT_DISPOSITIVO_ALTERACAO || !new RegExp('^[.]+$').test(texto)) {
    return texto;
  }

  return TEXTO_OMISSIS;
};

export const hasIndicativoFimAlteracao = (texto: string): boolean => {
  return /\.["”](?:\s*\(NR\))\s*$/.test(texto);
};

export const isDispositivoAlteracao = (dispositivo: Dispositivo): boolean => {
  const r = !!dispositivo.isDispositivoAlteracao;

  if (r) {
    return true;
  }

  try {
    return getArticulacao(dispositivo).pai !== undefined;
  } catch (error) {
    return false;
  }
};

export const isElementoDispositivoAlteracao = (elemento: Partial<Elemento>): boolean => {
  return elemento.hierarquia?.pai?.uuidAlteracao !== undefined;
};

export const validaDispositivosAfins = (dispositivo: Dispositivo | undefined, incluiDispositivo = true): Elemento[] => {
  const validados: Elemento[] = [];

  if (!dispositivo) {
    return [];
  }
  if (isDispositivoAlteracao(dispositivo) && hasFilhos(dispositivo) && dispositivo.filhos.filter(d => d.tipo === TipoDispositivo.omissis.tipo).length > 0) {
    criaElementoValidado(validados, dispositivo);
    dispositivo.filhos.filter(d => d.tipo === TipoDispositivo.omissis.tipo).forEach(o => criaElementoValidado(validados, o));
  }

  if (isDispositivoDeArtigo(dispositivo) || isDispositivoGenerico(dispositivo)) {
    const parent = isIncisoCaput(dispositivo) ? dispositivo.pai!.pai! : dispositivo.pai!;
    criaElementoValidado(validados, parent);
    if (isAgrupador(parent)) {
      criaElementoValidado(validados, isIncisoCaput(dispositivo) ? dispositivo.pai!.pai! : dispositivo.pai!);
    }
    irmaosMesmoTipo(dispositivo).forEach(filho => {
      !incluiDispositivo && filho === dispositivo ? undefined : criaElementoValidado(validados, filho, true);
    });
  } else if (incluiDispositivo && !isArticulacao(dispositivo) && !isAgrupador(dispositivo)) {
    criaElementoValidado(validados, dispositivo, true);
  }

  return validados;
};

const isPrimeiroArtigo = (dispositivo: Dispositivo): boolean => {
  return isArtigo(dispositivo) && getArticulacao(dispositivo).indexOfArtigo(dispositivo as Artigo) === 0;
};

export const isDesdobramentoAgrupadorAtual = (dispositivo: Dispositivo, tipo: string): boolean => {
  return dispositivo.pai!.tipo === tipo;
};

export const ajustaReferencia = (referencia: Dispositivo, dispositivo: Dispositivo): Dispositivo => {
  return isArticulacao(referencia) || isPrimeiroArtigo(dispositivo) || dispositivo.pai!.indexOf(dispositivo) === 0 ? referencia : getUltimoFilho(referencia);
};

export const naoPodeCriarFilho = (dispositivo: Dispositivo): boolean => {
  return hasIndicativoDesdobramento(dispositivo) && !acoesPossiveis(dispositivo).includes(adicionarElementoAction);
};

export const isNovoDispositivoDesmembrandoAtual = (texto: string): boolean => {
  return texto !== undefined && texto !== '';
};

export const getElementosDoDispositivo = (dispositivo: Dispositivo, valida = false): Elemento[] => {
  const lista: Elemento[] = [];

  getDispositivoAndFilhosAsLista(dispositivo).forEach(d => {
    if (valida) {
      const mensagens = validaDispositivo(d);
      if (mensagens) {
        d.mensagens = mensagens;
        lista.push(createElemento(d));
      }
    } else {
      lista.push(createElemento(d));
    }
  });
  return lista;
};

export const copiaDispositivosParaAgrupadorPai = (pai: Dispositivo, dispositivos: Dispositivo[]): Dispositivo[] => {
  return dispositivos.map(d => {
    const anterior = isArtigo(d) ? getDispositivoAnteriorMesmoTipo(d) : undefined;
    const novo = DispositivoLexmlFactory.create(pai, d.tipo, anterior);
    novo.texto = d.texto;
    novo.numero = d.numero;
    novo.rotulo = d.rotulo;
    novo.mensagens = d.mensagens;
    DispositivoLexmlFactory.copiaFilhos(d, novo);

    d.pai!.removeFilho(d);
    return novo;
  });
};

export const buildEventoAdicionarElemento = (atual: Dispositivo, novo: Dispositivo): Eventos => {
  const eventos = new Eventos();
  eventos.setReferencia(createElemento(ajustaReferencia(atual, novo)));
  eventos.add(StateType.ElementoIncluido, getElementosDoDispositivo(novo));
  eventos.add(StateType.ElementoRenumerado, buildListaElementosRenumerados(novo));
  eventos.add(StateType.ElementoValidado, validaDispositivosAfins(novo, false));

  return eventos;
};

export const buildEventoAtualizacaoElemento = (dispositivo: Dispositivo): Eventos => {
  const eventos = new Eventos();

  const elemento = createElemento(dispositivo);
  elemento.mensagens = validaDispositivo(dispositivo);

  eventos.add(StateType.ElementoModificado, [elemento]);
  eventos.add(StateType.ElementoValidado, validaDispositivosAfins(dispositivo));

  return eventos;
};

export const buildUpdateEvent = (dispositivo: Dispositivo): StateEvent[] => {
  dispositivo.mensagens = validaDispositivo(dispositivo);
  const elemento = createElemento(dispositivo);

  return [
    {
      stateType: StateType.ElementoModificado,
      elementos: [elemento],
    },
    {
      stateType: StateType.ElementoValidado,
      elementos: validaDispositivosAfins(dispositivo, true),
    },
  ];
};

export const buildEventoExclusaoElemento = (elementosRemovidos: Elemento[], elementosRenumerados: Elemento[], elementosValidados: Elemento[]): Eventos => {
  const eventos = new Eventos();

  eventos.add(StateType.ElementoRemovido, elementosRemovidos);
  eventos.add(StateType.ElementoRenumerado, elementosRenumerados);
  eventos.add(StateType.ElementoValidado, elementosValidados);

  return eventos;
};

export const buildEventoTransformacaooElemento = (
  atual: Dispositivo,
  novo: Dispositivo,
  elementosRemovidos: Elemento[],
  elementosRenumerados: Elemento[],
  elementosValidados: Elemento[]
): Eventos => {
  const eventos = new Eventos();

  eventos.setReferencia(createElemento(ajustaReferencia(atual, novo)));
  eventos.add(StateType.ElementoIncluido, getElementos(novo));
  eventos.add(StateType.ElementoRemovido, elementosRemovidos);
  eventos.add(StateType.ElementoRenumerado, elementosRenumerados);
  eventos.add(
    StateType.ElementoValidado,
    elementosValidados.filter(e => e.mensagens!.length > 0)
  );

  return eventos;
};

export const removeAndBuildEvents = (articulacao: Articulacao, dispositivo: Dispositivo): StateEvent[] => {
  const removidos = getElementos(dispositivo);
  const dispositivosRenumerados = listaDispositivosRenumerados(dispositivo);
  const dispositivoAnterior = getDispositivoAnterior(dispositivo);

  const pai = dispositivo.pai!;
  pai.removeFilho(dispositivo);
  pai.renumeraFilhos();

  const modificados = dispositivosRenumerados.map(d => createElemento(d));

  const dispositivoValidado =
    dispositivoAnterior && (isArtigoUnico(dispositivoAnterior) || isParagrafoUnico(dispositivoAnterior)) ? dispositivoAnterior : isCaput(pai!) ? pai!.pai! : pai!;

  if (articulacao.artigos.length === 1) {
    modificados.push(createElemento(articulacao.artigos[0]));
  }

  const eventos = buildEventoExclusaoElemento(removidos, modificados, validaDispositivosAfins(dispositivoValidado, false));
  return eventos.build();
};

export const removeAgrupadorAndBuildEvents = (articulacao: Articulacao, atual: Dispositivo): StateEvent[] => {
  let pos = atual.pai!.indexOf(atual);
  const agrupadoresAnteriorMesmoTipo = atual.pai!.filhos.filter((d, i) => i < pos && isAgrupador(d));

  const removidos = [...getElementos(atual)];

  const pai = agrupadoresAnteriorMesmoTipo?.length > 0 ? agrupadoresAnteriorMesmoTipo.reverse()[0] : atual.pai!;
  const dispositivoAnterior = agrupadoresAnteriorMesmoTipo?.length > 0 ? agrupadoresAnteriorMesmoTipo.reverse()[0] : pos > 0 ? getUltimoFilho(pai.filhos[pos - 1]) : pai;

  const dispositivos = atual.filhos.map(d => {
    const novo = agrupadoresAnteriorMesmoTipo?.length > 0 ? DispositivoLexmlFactory.create(pai!, d.tipo) : DispositivoLexmlFactory.create(pai, d.tipo, undefined, pos++);
    novo.texto = d.texto;
    novo.numero = d.numero;
    novo.rotulo = d.rotulo;
    novo.mensagens = d.mensagens;
    DispositivoLexmlFactory.copiaFilhos(d, novo);

    d.pai!.removeFilho(d);
    return novo;
  });

  atual.pai!.removeFilho(atual);
  pai.renumeraFilhos();

  const incluidos = dispositivos.map(d => getElementos(d)).flat();

  const renumerados = pai!.filhos
    .filter((f, index) => index >= pos)
    .map(d => getElementos(d))
    .flat()
    .filter(e => e.agrupador);

  const eventos = new Eventos();
  eventos.setReferencia(createElemento(dispositivoAnterior));
  eventos.add(StateType.ElementoIncluido, incluidos);
  eventos.add(StateType.ElementoRemovido, removidos);

  eventos.add(StateType.ElementoRenumerado, renumerados);
  return eventos.build();
};
