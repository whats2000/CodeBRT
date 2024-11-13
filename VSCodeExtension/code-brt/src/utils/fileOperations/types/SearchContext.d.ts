export type SearchResult = {
  file: string;
  line: number;
  column: number;
  match: string;
  beforeContext: string[];
  afterContext: string[];
};
