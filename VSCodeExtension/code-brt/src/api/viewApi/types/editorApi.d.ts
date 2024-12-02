export type EditorApi = {
  /**
   * Insert partial code into the editor.
   * Sometimes the LLm will return a partial code that needs to update the existing code.
   * @param code - The code to insert.
   * @param relativePath - The relative path to insert the code at.
   */
  insertPartialCode: (code: string, relativePath: string) => void;
}
