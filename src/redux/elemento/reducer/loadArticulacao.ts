import { Articulacao } from '../../../model/dispositivo/dispositivo';
import { getElementos } from '../../../model/elemento/elementoUtil';
import { State, StateType } from '../../state';

export const load = (articulacao: Articulacao, tipoDocumento?: string): State => {
  const elementos = getElementos(articulacao);
  return {
    articulacao,
    tipoDocumento,
    past: [],
    present: [],
    future: [],
    ui: {
      events: [
        {
          stateType: StateType.DocumentoCarregado,
          elementos: elementos,
        },
      ],
    },
  };
};
