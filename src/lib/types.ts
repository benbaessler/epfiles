export interface Source {
  chunk_id: string;
  score: number;
  doc_id: string;
  page_start: number;
  page_end: number;
  text: string;
  source_filename: string;
}
