import FileSystem, { File } from "./file-system";

interface ComponentFiles {
  name: string;
  template: { fileName: string; sourceText: string };
  component?: { fileName: string; sourceText: string };
}

function expect(value: any, message: string) {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}

export interface EditorOptions
  extends monaco.editor.IEditorConstructionOptions {
  file?: File;
  model?: monaco.editor.IModel;
}

const EDITOR_DEFAULTS = {
  scrollBeyondLastLine: false,
  theme: "solarized-dark",
  minimap: { enabled: false },
  file: undefined,
  model: undefined
};

export default class REPL {
  fs: FileSystem;
  editor: monaco.editor.IStandaloneCodeEditor;
  model: monaco.editor.IModel;
  constructor() {
    this.fs = new FileSystem();
  }

  onFileChange(cb) {
    this.fs.onChange(cb);
  }

  onFileModelChange(cb) {
    expect(this.model, "Must create ");
    this.editor.onDidChangeModel(cb);
  }

  getResolutionMap() {
    return this.fs.toResolutionMap();
  }

  createEditor(element: HTMLElement, options: EditorOptions = EDITOR_DEFAULTS) {
    let mergedOptions = Object.assign({}, EDITOR_DEFAULTS, options);

    if (mergedOptions.file === undefined && mergedOptions.model === undefined) {
      throw new Error(
        `Must pass either an existing file model or File to generate the model from.`
      );
    }

    if (mergedOptions.model === undefined) {
      mergedOptions.model = this.modelForFile(mergedOptions.file);
    }

    this.editor = monaco.editor.create(element, mergedOptions);
  }

  modelForFile(file: File): monaco.editor.IModel {
    let { sourceText, language, fileName } = file;
    let uri = monaco.Uri.parse(`file:///${fileName}`);

    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(sourceText, language, uri);

      model.updateOptions({
        tabSize: 2,
        insertSpaces: true
      });
    }

    return (this.model = model);
  }

  createFile(fileName: string, sourceText: string): File {
    return this.fs.createFile(fileName, sourceText);
  }

  generateFileFromJSON(
    files: ComponentFiles
  ): { component: File | null; template: File } {
    let { template, component } = files;
    let { fs } = this;

    let reifiedTemplate = fs.createFileFromJSON(template);
    let reifiedComponent = (component =
      component != undefined ? fs.createFileFromJSON(component) : null);

    return {
      template: reifiedTemplate,
      component: reifiedComponent
    };
  }
}
