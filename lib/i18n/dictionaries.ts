
const en = {
    study: {
        progress: "Progress",
        questionLabel: "Question",
        answerLabel: "Answer",
        true: "True",
        false: "False",
        initializing: "Initializing Study Session...",
        errorStarting: "Could not start session",
        noItems: "No items found for this mode.",
        finishSession: "Finish Session",
        nextQuestion: "Next Question",
        check: "Check",
        correct: "Correct! Great job! 🎉",
        wrong: "Wrong. Answer: {answer} 😔",
        partialWrong: "Some answers are wrong",
        correctAnswers: "Correct Answers:",
        flipInstruction: "Press Space or click card to flip",
        rate: {
            again: "Again",
            hard: "Hard",
            good: "Good",
            easy: "Easy",
            againTime: "< 1m",
            hardTime: "2d",
            goodTime: "4d",
            easyTime: "7d"
        },
        flipHint: "Space or Click to Flip",
        keyboardHint: "Use keys 1-4 to rate",
        summary: {
            title: "Session Complete!",
            subtitle: "Great job keeping up with your studies.",
            accuracy: "Accuracy",
            correct: "Correct",
            review: "Review",
            studyAgain: "Study Again",
            reviewWrong: "Review Wrong ({count})",
            backToModule: "Back to Module"
        }
    }
};

const tr = {
    study: {
        progress: "İlerleme",
        questionLabel: "Soru",
        answerLabel: "Cevap",
        true: "Doğru",
        false: "Yanlış",
        initializing: "Çalışma Oturumu Başlatılıyor...",
        errorStarting: "Oturum başlatılamadı",
        noItems: "Bu mod için içerik bulunamadı.",
        finishSession: "Çalışmayı Bitir",
        nextQuestion: "Sonraki Soru",
        check: "Kontrol Et",
        correct: "Doğru! Harika gidiyorsun! 🎉",
        wrong: "Yanlış. Cevap: {answer} 😔",
        partialWrong: "Bazı Cevaplar Yanlış",
        correctAnswers: "Doğru Cevaplar:",
        flipInstruction: "Çevirmek için Boşluk tuşuna basın veya karta tıklayın",
        rate: {
            again: "Tekrar",
            hard: "Zor",
            good: "İyi",
            easy: "Kolay",
            againTime: "< 1dk",
            hardTime: "2g",
            goodTime: "4g",
            easyTime: "7g"
        },
        flipHint: "Çevirmek için Boşluk veya Tıkla",
        keyboardHint: "Puanlamak için 1-4 tuşlarını kullanın",
        summary: {
            title: "Çalışma Tamamlandı!",
            subtitle: "Harika iş çıkardın.",
            accuracy: "Doğruluk",
            correct: "Doğru",
            review: "Tekrar",
            studyAgain: "Tekrar Çalış",
            reviewWrong: "Yanlışları Çalış ({count})",
            backToModule: "Modüle Dön"
        }
    }
};

export type Language = 'en' | 'tr';

export const getDictionary = (lang: string) => {
    if (lang === 'en') return en;
    return tr;
};

export const getStudyDictionary = (lang: string) => {
    if (lang === 'en') return en.study;
    return tr.study;
};
