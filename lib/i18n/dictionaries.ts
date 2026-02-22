
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
    solvePhoto: {
        title: "Solve from Photo",
        description: "Solve any educational question by taking a photo.",
        uploadPhoto: "Upload or Take Photo",
        solving: "Solving with AI...",
        solution: "Solution",
        takeNote: "Take a Note",
        saveToLibrary: "Save to Library",
        history: "Solution History",
        noHistory: "No solutions solved yet.",
        scanAgain: "Scan Again",
        errors: {
            blurry: "Image is too blurry or unreadable. Please take a clearer photo.",
            noQuestion: "No question detected in the image. Please upload a question photo.",
            multipleQuestions: "Multiple questions detected. Please focus on a single question.",
            generic: "An error occurred while solving the question. Please try again."
        }
    },
    library: {
        tabs: {
            modules: "Modules",
            collections: "Collections",
            aiSolutions: "AI Solutions",
            notes: "Notes"
        },
        notes: {
            title: "All Notes",
            noNotes: "No notes taken yet.",
            source: "Source",
            aiSolution: "AI Solution",
            moduleNote: "Module Note"
        }
    },
    creation: {
        title: "Create Interactive Lesson",
        description: "Turn any topic or document into an interactive lesson.",
        wizardTitle: "Curriculum Wizard",
        wizardDescription: "Enter the topic, AI will generate the best learning path for you.",
        topicLabel: "Topic or Title",
        topicPlaceholder: "e.g. Newton's Laws of Motion, French Revolution, CSS Grid...",
        goalLabel: "Learning Goal (Optional)",
        goalPlaceholder: "e.g. I am preparing for an exam, just a summary...",
        fileLabel: "Source File (PDF/PPTX)",
        uploadClick: "Click to upload",
        uploadDrag: "or drag and drop",
        fileTypes: "PDF, DOCX (Max. 10MB)",
        costEstimate: "Cost Estimate",
        planCost: "Plan creation: {count} Tokens.",
        sectionCost: "Each approved section: {count} Tokens.",
        generating: "Preparing Curriculum...",
        createPlan: "Create Plan ({count} Tokens)",
        manualTitle: "Manual Module Creation",
        editTitle: "Edit Module",
        newTitle: "Create New Module",
        next: "Next",
        step1Label: "Basic Info",
        step2Label: "Content",
        moduleTitleLabel: "Module Title",
        moduleTitlePlaceholder: "e.g. Spanish Vocabulary A1",
        descriptionLabelOptional: "Description (Optional)",
        descriptionPlaceholder: "What will you learn in this module?",
        titleDescription: "Enter a descriptive name for your module.",
        categoryLabel: "Category (Optional)",
        categoryPlaceholder: "Select Category",
        subCategoryLabel: "Sub Category",
        subCategoryPlaceholder: "Select Sub Category",
        firstSelectCategory: "Select Category First",
        visibilityLabel: "Visibility",
        public: "Public",
        publicDescription: "Other users can see and customize your module.",
        private: "Private",
        privateDescription: "Only you and people you share the link with can see the module.",
        save: "Save Module",
        contentTypeLabel: "Content Type",
        flashcardsLabel: "Flashcards",
        flashcardsDescription: "Front/Back cards. Ideal for memorization.",
        mcLabel: "Multiple Choice",
        mcDescription: "Test-style questions.",
        gapLabel: "Gap Fill",
        gapDescription: "Ideal for grammar.",
        tfLabel: "True / False",
        tfDescription: "Quick review questions.",
        moduleContentTitle: "Module Content",
        addItem: "Add Content",
        noItemsYet: "No content added yet.",
        addFirstItem: "Add your first {type} content",
        totalItems: "Total Content: {count}",
        itemFlashcard: "flashcard",
        itemMC: "question",
        itemGap: "gap fill",
        itemTF: "T/F question",
        itemGeneric: "content",
        noAnswer: "No answer",
        itemEditor: {
            add: "Add {type}",
            edit: "Edit {type}",
            newDescription: "Create new content.",
            editDescription: "Update your content.",
            questionLabel: "Question",
            questionPlaceholder: "Type the question here...",
            frontSide: "Front Side (Question)",
            backSide: "Back Side (Answer)",
            answerLabel: "Answer",
            answerPlaceholder: "Type the answer here...",
            trueLabel: "True",
            falseLabel: "False",
            correctAnswerLabel: "Correct Answer",
            optionsLabel: "Options",
            optionsHint: "Don't forget to mark the correct answer.",
            optionPlaceholder: "Option {index}",
            markAsCorrect: "Mark as correct",
            addOption: "Add Option",
            gapInstruction: "Gap Fill Sentence",
            hideSelected: "Hide Selected (Make Gap)",
            gapPlaceholder: "Write the sentence, select the word you want to hide and press the button.",
            livePreview: "Live Preview:",
            noGapsYet: "No gaps added yet.",
            solutionLabel: "Solution / Detailed Explanation (Optional)",
            solutionPlaceholder: "You can add the logic or details of the answer here.",
            uploadImage: "Add Image",
            comingSoon: "Coming Soon",
            imageFeatureHint: "Image upload feature will be added very soon.",
            errorNoGaps: "Please add at least one gap (select text and hide it).",
            errorNoSelection: "Please select some text to hide."
        },
        incompleteContent: "Incomplete Content",
        collection: {
            newTitle: "Create New Collection",
            description: "Group your modules into a sequential learning path.",
            publicDescription: "Other users can see and customize your collection.",
            privateDescription: "Only you and people you share the link with can see the collection."
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
        byAuthor: "by @{author}",
        optional: "optional"
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
    },
    validation: {
        titleMin: "Title must be at least 3 characters",
        titleMax: "Title cannot exceed 100 characters",
        descriptionMax: "Description cannot exceed 500 characters",
        atLeastOneItem: "Please add at least one content item.",
        failedToLoad: "Module could not be loaded",
        failedToSave: "Transaction failed",
        moduleUpdated: "Module updated.",
        moduleCreated: "Module successfully created.",
        categoryRequired: "Please select a category (Required for Public modules)",
        subCategoryRequired: "Please select a sub-category"
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
    solvePhoto: {
        title: "Fotoğraftan Soru Çöz",
        description: "Fotoğrafını çekerek herhangi bir soruyu AI ile anında çözün.",
        uploadPhoto: "Fotoğraf Çek veya Yükle",
        solving: "AI ile Çözülüyor...",
        solution: "Çözüm",
        takeNote: "Not Al",
        saveToLibrary: "Kitaplığa Kaydet",
        history: "Çözüm Geçmişi",
        noHistory: "Henüz hiç soru çözülmedi.",
        scanAgain: "Yeni Taram",
        errors: {
            blurry: "Görüntü çok bulanık veya okunamaz durumda. Lütfen daha net bir fotoğraf çekin.",
            noQuestion: "Görüntüde bir soru tespit edilemedi. Lütfen bir soru fotoğrafı yükleyin.",
            multipleQuestions: "Birden fazla soru tespit edildi. Lütfen tek bir soruya odaklanın.",
            generic: "Soru çözülürken bir hata oluştu. Lütfen tekrar deneyin."
        }
    },
    library: {
        tabs: {
            modules: "Modüller",
            collections: "Koleksiyonlar",
            aiSolutions: "AI Çözümleri",
            notes: "Notlar"
        },
        notes: {
            title: "Tüm Notlar",
            noNotes: "Henüz not alınmamış.",
            source: "Kaynak",
            aiSolution: "AI Çözümü",
            moduleNote: "Modül Notu"
        }
    },
    creation: {
        title: "İnteraktif Ders Oluştur",
        description: "Herhangi bir konuyu veya belgeyi etkileşimli bir derse dönüştür.",
        wizardTitle: "Müfredat Sihirbazı",
        wizardDescription: "Konuyu gir, AI senin için en iyi öğrenme yolunu çıkarsın.",
        topicLabel: "Konu veya Başlık",
        topicPlaceholder: "Örn: Newton Hareket Yasaları, Fransız Devrimi, CSS Grid...",
        goalLabel: "Öğrenme Hedefi (Opsiyonel)",
        goalPlaceholder: "Örn: Sınava hazırlanıyorum, sadece özet geç...",
        fileLabel: "Kaynak Dosya (PDF/PPTX)",
        uploadClick: "Yüklemek için tıkla",
        uploadDrag: "veya sürükle bırak",
        fileTypes: "PDF, DOCX (Maks. 10MB)",
        costEstimate: "Maliyet Tahmini",
        planCost: "Plan oluşturma: {count} Token.",
        sectionCost: "Onaylanan her bölüm: {count} Token.",
        generating: "Müfredat Hazırlanıyor...",
        createPlan: "Planı Oluştur ({count} Token)",
        manualTitle: "Manuel Modül Oluşturma",
        editTitle: "Modülü Düzenle",
        newTitle: "Yeni Modül Oluştur",
        next: "İleri",
        step1Label: "Temel Bilgiler",
        step2Label: "İçerik",
        moduleTitleLabel: "Modül Başlığı",
        moduleTitlePlaceholder: "Örn: İspanyolca Kelimeler A1",
        descriptionLabelOptional: "Açıklama (Opsiyonel)",
        descriptionPlaceholder: "Bu modülde ne öğreneceksiniz?",
        titleDescription: "Modülünüz için açıklayıcı bir isim girin.",
        categoryLabel: "Kategori (Opsiyonel)",
        categoryPlaceholder: "Kategori Seçin",
        subCategoryLabel: "Alt Kategori",
        subCategoryPlaceholder: "Alt Kategori Seçin",
        firstSelectCategory: "Önce Kategori Seçin",
        visibilityLabel: "Görünürlük",
        public: "Herkese Açık (Public)",
        publicDescription: "Diğer kullanıcılar modülünüzü görebilir ve özelleştirebilir.",
        private: "Gizli (Private)",
        privateDescription: "Modülü sadece siz ve linki paylaştığınız kişiler görebilir.",
        save: "Modülü Kaydet",
        contentTypeLabel: "İçerik Tipi",
        flashcardsLabel: "Kartlar",
        flashcardsDescription: "Ön/Arka kartlar. Ezber için ideal.",
        mcLabel: "Çoktan Seçmeli",
        mcDescription: "Test usulü sorular.",
        gapLabel: "Boşluk Doldurma",
        gapDescription: "Dil bilgisi için ideal.",
        tfLabel: "Doğru / Yanlış",
        tfDescription: "Hızlı tekrar soruları.",
        moduleContentTitle: "Modül İçeriği",
        addItem: "İçerik Ekle",
        noItemsYet: "Henüz içerik eklenmedi.",
        addFirstItem: "İlk {type} içeriğini ekle",
        totalItems: "Toplam İçerik: {count}",
        itemFlashcard: "kart",
        itemMC: "soru",
        itemGap: "boşluk doldurma",
        itemTF: "D/Y sorusu",
        itemGeneric: "içerik",
        noAnswer: "Cevap yok",
        itemEditor: {
            add: "{type} Ekle",
            edit: "{type} Düzenle",
            newDescription: "Yeni içerik oluşturun.",
            editDescription: "İçeriği güncelleyin.",
            questionLabel: "Soru",
            questionPlaceholder: "Soruyu buraya yazın...",
            frontSide: "Ön Yüz (Soru)",
            backSide: "Arka Yüz (Cevap)",
            answerLabel: "Cevap",
            answerPlaceholder: "Cevabı buraya yazın...",
            trueLabel: "Doğru",
            falseLabel: "Yanlış",
            correctAnswerLabel: "Doğru Cevap",
            optionsLabel: "Seçenekler",
            optionsHint: "Doğru cevabı işaretlemeyi unutmayın.",
            optionPlaceholder: "Seçenek {index}",
            markAsCorrect: "Doğru cevap olarak işaretle",
            addOption: "Seçenek Ekle",
            gapInstruction: "Boşluk Doldurma Cümlesi",
            hideSelected: "Seçili Alanı Gizle (Boşluk Yap)",
            gapPlaceholder: "Cümleyi yazın, gizlemek istediğiniz kelimeyi seçip butona basın.",
            livePreview: "Canlı Görünüm:",
            noGapsYet: "Henüz hiç boşluk eklenmedi.",
            solutionLabel: "Çözüm / Detaylı Açıklama (Opsiyonel)",
            solutionPlaceholder: "Cevabın mantığını veya detayını buraya ekleyebilirsiniz.",
            uploadImage: "Görsel Ekle",
            comingSoon: "Yakında",
            imageFeatureHint: "Görsel yükleme özelliği çok yakında eklenecek.",
            errorNoGaps: "Lütfen en az bir boşluk ekleyin (metni seçip gizleyin).",
            errorNoSelection: "Lütfen gizlemek için bir metin seçin."
        },
        incompleteContent: "Eksik İçerik",
        collection: {
            newTitle: "Yeni Koleksiyon Oluştur",
            description: "Modüllerinizi sıralı bir öğrenme yolunda gruplayın.",
            publicDescription: "Diğer kullanıcılar koleksiyonunuzu görebilir ve özelleştirebilir.",
            privateDescription: "Koleksiyonu sadece siz ve linki paylaştığınız kişiler görebilir."
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
        byAuthor: "yazar: @{author}",
        optional: "opsiyonel"
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
                description: "Tüm modülleri, öğeleri ve çalışma oturumlarını kalıcı olarak siler. Geri dönüşı yoktur.",
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
    },
    validation: {
        titleMin: "Başlık en az 3 karakter olmalıdır",
        titleMax: "Başlık 100 karakteri geçemez",
        descriptionMax: "Açıklama 500 karakteri geçemez",
        atLeastOneItem: "Lütfen en az bir içerik ekleyin.",
        failedToLoad: "Modül yüklenemedi",
        failedToSave: "İşlem başarısız",
        moduleUpdated: "Modül güncellendi.",
        moduleCreated: "Modül başarıyla oluşturuldu.",
        categoryRequired: "Lütfen bir kategori seçin (Public modüller için zorunlu)",
        subCategoryRequired: "Lütfen bir alt kategori seçin"
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
