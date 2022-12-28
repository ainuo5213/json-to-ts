import is from 'is';
import type from 'get-type';
import { Project } from 'ts-morph';
import fse from 'fs-extra';
const sourceFile = './source.tmp.ts';

function ensureSourceFile() {
  if (fse.pathExistsSync(sourceFile)) {
    fse.removeSync(sourceFile);
  }
  fse.ensureFileSync(sourceFile);
}
const project = new Project();

export default function jsToTs(input, rootInterfaceName) {
  const isObjectOrArray = is.array(input) || is.object(input);
  ensureSourceFile();
  const source = project.addSourceFileAtPath(sourceFile);
  try {
    let text = '';
    if (isObjectOrArray) {
      jsonToTs(input, source, rootInterfaceName);
      text = source.getText();
    } else {
      primitiveToTs(input, source, rootInterfaceName);
      text = source.getText();
    }
    return text;
  } catch (error) {
    throw error;
  } finally {
    fse.removeSync(sourceFile);
  }
}

function primitiveToTs(primitiveInput, source, rootInterfaceName) {
  rootInterfaceName = rootInterfaceName || 'IPrimitiveData';
  source.addTypeAlias({
    name: rootInterfaceName,
    isExported: true,
    type: getType(primitiveInput)
  });
}
function jsonToTs(jsonInput, source, rootInterfaceName) {
  if (is.object(jsonInput)) {
    return objectToTs(jsonInput, source, rootInterfaceName);
  } else {
    return arrayToTs(jsonInput, source, rootInterfaceName);
  }
}
function objectToTs(objectInput, source, interfaceName) {
  interfaceName = interfaceName || 'IDataObject';
  const entries = Object.entries(objectInput);
  const currentInterface = source.addInterface({
    name: interfaceName,
    properties: [],
    isExported: true
  });
  for (let [key, currentValue] of entries) {
    const interfaceName = capitalize(key);
    const currentType = getType(currentValue);
    if (currentType === 'array') {
      const type = arrayToTs(currentValue, source, interfaceName);
      currentInterface.addProperty({ name: key, type: type });
    } else if (currentType === 'object') {
      const childInterface = objectToTs(currentValue, source, interfaceName);
      currentInterface.addProperty({
        name: key,
        type: childInterface.getName()
      });
    } else {
      currentInterface.addProperty({ name: key, type: currentType });
    }
  }
  return currentInterface;
}

function arrayToTs(arrayInput, source, interfaceName) {
  interfaceName = interfaceName || 'IArrayData';
  const objectElements = arrayInput.filter((r) => type.get(r) === 'object');
  const primitiveElements = arrayInput.filter((r) => {
    let currentType = getType(r);
    return ['boolean', 'number', 'null', 'string', 'undefined'].includes(
      currentType
    );
  });
  const primitiveElementTypes = unique(
    primitiveElements.map((r) => getType(r))
  );
  let types;
  if (objectElements.length > 0) {
    const objectType = objectToTs(
      objectElements[0],
      source,
      capitalize(interfaceName)
    );
    types = `${objectType.getName()}[]`;
  } else {
    types = `${primitiveElementTypes.join(' | ')}[]`;
  }
  return types;
}

function unique(types) {
  return Array.from(new Set(types));
}

function capitalize(key) {
  return key.slice(0, 1).toUpperCase() + key.slice(1);
}

function getType(value) {
  let currentType = type.get(value);
  currentType = currentType === 'json' ? 'string' : currentType;
  return currentType;
}
