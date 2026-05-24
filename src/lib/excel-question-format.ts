export const QUESTION_EXCEL_HEADERS = [
    'Modul #',
    'Fejezet #',
    'Sorszám',
    'Kérdés',
    'Válasz A',
    'Válasz B',
    'Válasz C',
    'Válasz D',
    'Helyes betű',
] as const;

export function correctIndicesToLetters(indices: number[]): string {
    return indices
        .map((index) => String.fromCharCode(65 + index))
        .join(', ');
}

export function lettersToCorrectIndices(letters: string, optionCount: number): number[] {
    const correctOptions: number[] = [];
    const chars = String(letters).split(',').map((s) => s.trim().toUpperCase());

    chars.forEach((char) => {
        const index = char.charCodeAt(0) - 65;
        if (index >= 0 && index < optionCount) {
            correctOptions.push(index);
        }
    });

    return correctOptions;
}

export function questionToExcelRow(
    modNum: number,
    chapNum: number,
    sorszam: number,
    question: { text: string; options: string[]; correctOptions: number[] }
): (string | number)[] {
    const options = question.options.slice(0, 4);
    while (options.length < 4) {
        options.push('');
    }

    return [
        modNum,
        chapNum,
        sorszam,
        question.text,
        options[0],
        options[1],
        options[2],
        options[3],
        correctIndicesToLetters(question.correctOptions),
    ];
}

export function sanitizeExcelFilename(title: string, courseId: string): string {
    const sanitized = title
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return `${sanitized || `kerdesek-${courseId}`}-kerdesek.xlsx`;
}
