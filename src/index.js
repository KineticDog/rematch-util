import { get, last, upperFirst } from 'lodash';

const identifiedCheck = (targetA, targetB, identifier) => {
  if (!identifier) return targetA === targetB;
  else if (typeof identifier === 'function') return identifier(targetA) === identifier(targetB);
  else return get(targetA, identifier) === get(targetB, identifier);
};

export const generateModels = models => {
  for (let model of Object.values(models)) {
    if (model.state && model?.genReducer?.required) {
      const neglect = model?.genReducer?.neglect || [];
      const reducers = Object.keys(model.state).reduce(
        (reducers, key) =>
          neglect.includes(key)
            ? reducers
            : {
                ...reducers,
                [`set${upperFirst(key)}`]: (state, payload) => ({
                  ...state,
                  [key]: payload,
                }),
                [`add${upperFirst(key)}`]: (state, payload) => {
                  const prevData = Array.isArray(state[key]) ? state[key] : [state[key]];
                  const newData = Array.isArray(payload) ? payload : [payload];
                  const data = [...prevData, ...newData];
                  return { ...state, [key]: data };
                },
                [`edit${upperFirst(key)}`]: (state, payload, identifier) => {
                  const prevData = Array.isArray(state[key]) ? state[key] : [state[key]];
                  const updateData = Array.isArray(payload) ? payload : [payload];
                  const data = prevData.map(
                    item =>
                      updateData.find(updateItem =>
                        identifiedCheck(item, updateItem, identifier),
                      ) || item,
                  );
                  return { ...state, [key]: data };
                },
                [`delete${upperFirst(key)}`]: (state, payload, identifier) => {
                  const prevData = Array.isArray(state[key]) ? state[key] : [state[key]];
                  const deleteData = Array.isArray(payload) ? payload : [payload];
                  const data = prevData.filter(
                    item =>
                      !deleteData.find(deleteItem => identifiedCheck(item, deleteItem, identifier)),
                  );
                  return { ...state, [key]: data };
                },
              },
        {},
      );
      model.reducers = {
        ...reducers,
        ...model.reducers,
      };
    }
  }
  return models;
};

export const quickMap = (quickMap = [], customedMap = {}) => {
  const quickMapArray = Array.isArray(quickMap) ? quickMap : [quickMap];
  const allMap = quickMapArray.reduce(
    (allMap, path) => ({ ...allMap, [path]: undefined }),
    customedMap,
  );
  const mapState = state =>
    Object.entries(allMap).reduce((mapState, [prop, path]) => {
      if (!prop) return mapState;
      else if (typeof path === 'function') return { ...mapState, [prop]: path(state) };
      else {
        const finalProp = path
          ? prop
          : prop.includes('loading')
          ? 'loading'
          : last(prop.split('.'));
        const finalPath = path || prop;
        return { ...mapState, [finalProp]: get(state, finalPath) };
      }
    }, {});
  return mapState;
};
