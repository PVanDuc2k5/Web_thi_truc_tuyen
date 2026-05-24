export interface CreateQuestionBody {
  question: string;
  category?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
}