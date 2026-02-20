
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
        showAnswer: "Show Answer",
        untitledItem: "Untitled Item",
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
        },
        moduleActions: {
            study: "Study",
            review: "Review",
            focusMistakes: "Focus on Mistakes",
            shuffle: "Shuffle Review",
            delete: "Delete Item",
            optionsTitle: "Select Study Mode",
            startStudy: "Start Studying",
            resumeStudy: "Continue Studying"
        },
        moduleTypes: {
            title: "Module Type",
            all: "All Types",
            flashcard: "Flashcards",
            mc: "Multiple Choice",
            true_false: "True / False",
            gap: "Gap Fill"
        }
    },
    common: {
        cancel: "Cancel",
        exit: "Exit",
        confirmExit: "Are you sure you want to exit?",
        exitDescription: "Your progress ({progress}) will be saved. You can resume anytime from where you left off.",
        back: "Back",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        loading: "Loading...",
        error: "An error occurred",
        success: "Success",
        preview: "Preview",
        noDescription: "No description provided.",
        itemsCount: "{count} Items",
        byAuthor: "by @{author}"
    },
    admin: {
        dashboard: {
            title: "Admin Dashboard",
            description: "Overview of system-wide data and statistics.",
            stats: {
                users: "Total Users",
                modules: "Global Modules",
                items: "Total Items",
                library: "Library Connections"
            },
            recentActivity: "Recent Activity",
            noActivity: "No activity recorded yet.",
            health: "System Health",
            dbConnected: "CONNECTED",
            operational: "OPERATIONAL",
            production: "PRODUCTION"
        },
        users: {
            title: "User Management",
            description: "View and manage all users in the system.",
            searchPlaceholder: "Search users...",
            table: {
                user: "User",
                role: "Role",
                status: "Status",
                date: "Registration Date",
                actions: "Actions"
            },
            noUsers: "No users found yet."
        },
        modules: {
            title: "Module Moderation",
            description: "Monitor, archive or moderate all modules.",
            searchPlaceholder: "Search modules...",
            filter: "Filter",
            noModules: "No modules created yet.",
            items: "{count} Items",
            archived: "Archived",
            seeConnections: "See Connections"
        },
        system: {
            title: "System Health",
            description: "Monitor server performance and database status.",
            serverStatus: "Server Status",
            dbHealth: "Database Health",
            lastBackup: "Last Backup"
        },
        tools: {
            title: "Database & Maintenance Tools",
            description: "Advanced tools to repair, clean or sync system data.",
            rescue: {
                title: "Data Repair (Rescue)",
                description: "Detects missing modules in user libraries and restores them automatically.",
                button: "Start Reputation Repair"
            },
            cleanup: {
                title: "Dangerous Area (Cleanup)",
                description: "Permanently deletes all modules, items and sessions. Undoing is not possible.",
                button: "Reset Database (CAUTION!)"
            },
            cache: {
                title: "Cache & Session",
                description: "Clears global application cache.",
                button: "Global Cache Purge"
            },
            confirm: "Are you sure you want to proceed?",
            successRepair: "{count} library entries repaired successfully.",
            successReset: "System content reset successfully.",
            error: "An error occurred."
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
        showAnswer: "Cevabı Gör",
        untitledItem: "Başlıksız Öğe",
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
            review: "Gözden Geçir",
            studyAgain: "Tekrar Çalış",
            reviewWrong: "Yanlışları Çalış ({count})",
            backToModule: "Modüle Dön"
        },
        moduleActions: {
            study: "Çalış",
            review: "Gözden Geçir",
            focusMistakes: "Yanlışlara Odaklan",
            shuffle: "Karışık Tekrar",
            delete: "Öğeyi Sil",
            optionsTitle: "Çalışma Modu Seçin",
            startStudy: "Çalışmaya Başla",
            resumeStudy: "Çalışmaya Devam Et"
        },
        moduleTypes: {
            title: "Module Type",
            all: "Tüm Tipler",
            flashcard: "Kartlar",
            mc: "Çoktan Seçmeli",
            true_false: "Doğru / Yanlış",
            gap: "Boşluk Doldurma"
        }
    },
    common: {
        cancel: "Vazgeç",
        exit: "Çıkış Yap",
        confirmExit: "Çıkmak istediğine emin misin?",
        exitDescription: "İlerlemen ({progress}) kaydedilecek. İstediğin zaman kaldığın yerden devam edebilirsin.",
        back: "Geri",
        save: "Kaydet",
        delete: "Sil",
        edit: "Düzenle",
        loading: "Yükleniyor...",
        error: "Bir hata oluştu",
        success: "Başarılı",
        preview: "Önizleme",
        noDescription: "Açıklama girilmemiş.",
        itemsCount: "{count} Öğe",
        byAuthor: "yazar: @{author}"
    },
    admin: {
        dashboard: {
            title: "Yönetim Paneli",
            description: "Sistem genelindeki verilere ve istatistiklere genel bakış.",
            stats: {
                users: "Toplam Kullanıcı",
                modules: "Global Modüller",
                items: "Toplam Öğe",
                library: "Kütüphane Bağlantıları"
            },
            recentActivity: "Son Aktiviteler",
            noActivity: "Henüz aktivite kaydı bulunmuyor.",
            health: "Sistem Sağlığı",
            dbConnected: "BAĞLI",
            operational: "ÇALIŞIYOR",
            production: "CANLI"
        },
        users: {
            title: "Kullanıcı Yönetimi",
            description: "Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin.",
            searchPlaceholder: "Kullanıcı ara...",
            table: {
                user: "Kullanıcı",
                role: "Rol",
                status: "Durum",
                date: "Kayıt Tarihi",
                actions: "İşlemler"
            },
            noUsers: "Henüz kullanıcı bulunmuyor."
        },
        modules: {
            title: "Modül Moderasyonu",
            description: "Sistemdeki tüm modülleri izleyin, arşivleyin veya içeriklerini denetleyin.",
            searchPlaceholder: "Modül ara...",
            filter: "Filtre",
            noModules: "Henüz modül oluşturulmamış.",
            items: "{count} Öğe",
            archived: "Arşiviendi",
            seeConnections: "Bağlantılara Bak"
        },
        system: {
            title: "Sistem Sağlığı",
            description: "Sunucu performansı, veritabanı durumu ve güvenlik yapılandırmalarını izleyin.",
            serverStatus: "Sunucu Durumu",
            dbHealth: "Veritabanı Sağlığı",
            lastBackup: "Son Yedekleme"
        },
        tools: {
            title: "Veritabanı ve Bakım Araçları",
            description: "Sistemi onarmak, temizlemek veya verileri senkronize etmek için gelişmiş araçlar.",
            rescue: {
                title: "Veri Onarım (Rescue)",
                description: "Kullanıcı kütüphanelerinde eksik olan modülleri tespit eder ve otomatik olarak geri ekler.",
                button: "Reputation Repair Başlat"
            },
            cleanup: {
                title: "Tehlikeli Alan (Cleanup)",
                description: "Tüm modülleri, öğeleri ve çalışma oturumlarını kalıcı olarak siler. Geri dönüşü yoktur.",
                button: "Veritabanını Sıfırla (DİKKAT!)"
            },
            cache: {
                title: "Cache & Session",
                description: "Uygulama genelindeki önbelleği (API Cache) temizler.",
                button: "Global Cache Purge"
            },
            confirm: "Bu işlemi gerçekleştirmek istediğinize emin misiniz?",
            successRepair: "{count} kütüphane kaydı başarıyla onarıldı.",
            successReset: "Sistem içerikleri başarıyla sıfırlandı.",
            error: "Bir hata oluştu."
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
