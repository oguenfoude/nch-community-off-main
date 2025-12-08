// lib/translations.ts
export const translations = {
    fr: {
        title: "NCH Community",
        slogan: "Votre passerelle vers l'emploi international",
        home: "Accueil",
        about: "À propos",
        contact: "Contact",
        login: "Connexion",
        logout: "Déconnexion",
        register: "S'inscrire",
        profile: "Profil",
        jobs: "Emplois",
        events: "Événements",
        news: "Actualités",
        search: "Rechercher",
        language: "Langue",
        welcome: "Bienvenue",
        description: "Nous vous accompagnons dans votre recherche d'emploi à l'étranger avec des services professionnels et personnalisés.",
        cta: "Commencer mon inscription",

        // ✅ MISE À JOUR : Ajouter la structure détaillée des steps
        steps: {
            step1: "Informations de base",
            step2: "Documents requis",
            step3: "Choix de l'offre",
            step4: "Garantie et Paiement",

            // ✅ NOUVEAU : Structure détaillée pour chaque étape
            personal: {
                title: "Informations Personnelles",
                subtitle: "Renseignez vos informations de base"
            },
            education: {
                title: "Formation et Compétences",
                subtitle: "Parlez-nous de votre parcours éducatif"
            },
            documents: {
                title: "Documents Requis",
                subtitle: "Téléchargez vos documents justificatifs",
                fields: {
                    id: {
                        label: "Carte d'identité ou passeport",
                        description: "Document d'identité officiel"
                    },
                    diploma: {
                        label: "Diplôme ou attestation",
                        description: "Votre diplôme principal ou attestation d'études"
                    },
                    workCertificate: {
                        label: "Attestation de travail",
                        description: "Certificat de votre employeur actuel ou précédent"
                    },
                    photo: {
                        label: "Photo d'identité",
                        description: "Photo récente de qualité professionnelle"
                    }
                }
            },
            offer: {
                title: "Choisir votre offre",
                subtitle: "Sélectionnez l'offre qui correspond à vos besoins"
            }
        },

        form: {
            firstName: "Prénom",
            lastName: "Nom",
            phone: "Numéro de téléphone",
            email: "Adresse email",
            wilaya: "Wilaya",
            diploma: "Diplôme ou niveau d'étude",
            countries: "Pays choisis",
            uploadId: "Carte d'identité ou passeport",
            uploadDiploma: "Diplôme ou attestation",
            uploadWork: "Attestation de travail",
            uploadPhoto: "Photo d'identité",
            selectedCountries: "Pays de destination", // ✅ Déjà présent
            placeholders: {
                firstName: "Entrez votre prénom",
                lastName: "Entrez votre nom",
                phone: "Ex: 0555123456",
                email: "votre.email@exemple.com",
                wilaya: "Sélectionnez votre wilaya",
                diploma: "Ex: Licence en Informatique, Master en Sciences...",
                selectedCountries: "Ex: France" // ✅ Déjà présent
            },
            hints: {
                selectedCountries: "" // ✅ Déjà présent
            }
        },
        offers: {
            basic: {
                title: "Offre de Base",
                price: "À partir de 21,000 DA",
                features: ["Dossier professionnel complet", "Envoi à 50 entreprises", "1 pays uniquement"],
            },
            premium: {
                title: "Offre Premium",
                price: "À partir de 28,000 DA",
                features: ["Dossier professionnel complet", "Envoi à 100 entreprises", "2 pays au choix"],
            },
            gold: {
                title: "Offre Gold",
                price: "À partir de 35,000 DA",
                features: ["Dossier professionnel complet", "Envoi à 200 entreprises", "Jusqu'à 5 pays"],
            },
        },
        payment: {
            title: "Choisissez votre méthode de paiement",
            cib: "Carte CIB",
            baridimob: "CCP / BaridiMob",
            later: "Payer plus tard",
            descriptions: {
                cib: "Paiement sécurisé en ligne par carte CIB",
                baridimob: "Virement CCP - Algérie Poste",
                later: "Enregistrer le compte et payer ultérieurement",
            },
            typeTitle: "Choisissez votre mode de paiement", // FR
            fullPayment: "Paiement Intégral",
            partialPayment: "Paiement en 2 fois",
            fullPaymentDesc: "Payez le montant total maintenant et bénéficiez d'une réduction",
            partialPaymentDesc: "Payez 50% maintenant, le reste après livraison du dossier",
            discount: "Économisez",
            firstPayment: "1er versement",
            secondPayment: "2ème versement",
            total: "Total"
        },
        guarantee: "Télécharger la Lettre de Garantie Officielle",
        guaranteeDesc: "Remboursement 100% garanti si aucune réponse d'entreprise",
        errors: {
            required: "Ce champ est obligatoire",
            email: "Veuillez entrer une adresse email valide",
            phone: "Veuillez entrer un numéro de téléphone valide",
            documents: "Veuillez télécharger tous les documents requis",
            offer: "Veuillez sélectionner une offre",
            payment: "Veuillez choisir une méthode de paiement",
        },
        success: "Inscription réussie! Votre dossier a été enregistré.",
        submit: "Soumettre",
        submitting: "Soumission en cours...",
        cancel: "Annuler",
        save: "Enregistrer",
        edit: "Modifier",
        delete: "Supprimer",
        update: "Mettre à jour",
        yes: "Oui",
        no: "Non",
        loading: "Chargement...",
        error: "Une erreur s'est produite.",
        successGeneral: "Succès!",
        notFound: "Page non trouvée",
        requiredGeneral: "Ce champ est requis",
        emailGeneral: "Email",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        rememberMe: "Se souvenir de moi",
        forgotPassword: "Mot de passe oublié?",
        alreadyHaveAccount: "Vous avez déjà un compte?",
        dontHaveAccount: "Vous n'avez pas de compte?",
        signUp: "S'inscrire",
        signIn: "Se connecter",
        terms: "Conditions d'utilisation",
        privacy: "Politique de confidentialité",
        dashboard: "Tableau de bord",
        settings: "Paramètres",
        notifications: "Notifications",
        members: "Membres",
        community: "Communauté",
        resources: "Ressources",
        help: "Aide",
        support: "Support",
        viewMore: "Voir plus",
        viewLess: "Voir moins",
        postedOn: "Publié le",
        by: "par",
        readMore: "Lire la suite",
        back: "Retour",
        next: "Suivant",
        previous: "Précédent"
    },
    ar: {
        title: "Nch Community",
        slogan: "بوابتك نحو العمل الدولي",
        home: "الرئيسية",
        about: "حول",
        contact: "اتصل بنا",
        login: "تسجيل الدخول",
        logout: "تسجيل الخروج",
        register: "إنشاء حساب",
        profile: "الملف الشخصي",
        jobs: "الوظائف",
        events: "الفعاليات",
        news: "الأخبار",
        search: "بحث",
        language: "اللغة",
        welcome: "مرحبا",
        description: "نحن نرافقك في البحث عن عمل في الخارج بخدمات مهنية ومخصصة.",
        cta: "ابدأ التسجيل",

        // ✅ MISE À JOUR : Ajouter la structure détaillée des steps
        steps: {
            step1: "المعلومات الأساسية",
            step2: "الوثائق المطلوبة",
            step3: "اختيار العرض",
            step4: "الضمان والدفع",

            // ✅ NOUVEAU : Structure détaillée pour chaque étape
            personal: {
                title: "المعلومات الشخصية",
                subtitle: "أدخل معلوماتك الأساسية"
            },
            education: {
                title: "التعليم والمهارات",
                subtitle: "أخبرنا عن خلفيتك التعليمية"
            },
            documents: {
                title: "الوثائق المطلوبة",
                subtitle: "ارفع وثائقك الداعمة",
                fields: {
                    id: {
                        label: "بطاقة الهوية أو جواز السفر",
                        description: "وثيقة هوية رسمية"
                    },
                    diploma: {
                        label: " شهادة مدرسية أو الديبلوم",
                        description: "شهادتك الرئيسية أو شهادة الدراسة"
                    },
                    workCertificate: {
                        label: "شهادة العمل",
                        description: "شهادة من صاحب العمل الحالي أو السابق"
                    },
                    photo: {
                        label: "صورة شخصية",
                        description: "صورة حديثة بجودة مهنية"
                    }
                }
            },
            offer: {
                title: "اختر عرضك",
                subtitle: "حدد العرض الذي يلبي احتياجاتك"
            }
        },

        form: {
            firstName: "الاسم الأول",
            lastName: "اللقب",
            phone: "رقم الهاتف",
            email: "البريد الإلكتروني",
            wilaya: "الولاية",
            diploma: "الشهادة أو المستوى الدراسي",
            countries: "البلدان المختارة",
            uploadId: "بطاقة الهوية أو جواز السفر",
            uploadDiploma: "ديبلوم أو شهادة مدرسية",
            uploadWork: "شهادة العمل",
            uploadPhoto: "صورة شخصية",
            selectedCountries: "البلدان المقصودة", // ✅ Ajouté en arabe
            placeholders: {
                firstName: "أدخل اسمك الأول",
                lastName: "أدخل لقبك",
                phone: "+213 XXX XXX XXX",
                email: "your.email@example.com",
                wilaya: "اختر ولايتك",
                diploma: "مثال: ليسانس في الإعلام الآلي، ماستر في العلوم...",
                selectedCountries: "مثال: فرنسا" // ✅ Ajouté en arabe
            },
            hints: {
                selectedCountries: "" // ✅ Ajouté en arabe
            }
        },
        offers: {
            basic: {
                title: "العرض الأساسي",
                price: "ابتداءً من 21,000 دج",
                features: ["ملف مهني كامل", "إرسال لـ 50 شركة", "بلد واحد فقط"],
            },
            premium: {
                title: "العرض المميز",
                price: "ابتداءً من 28,000 دج",
                features: ["ملف مهني كامل", "إرسال لـ 100 شركة", ""],
            },
            gold: {
                title: "العرض الذهبي",
                price: "ابتداءً من 35,000 دج",
                features: ["ملف مهني كامل", "إرسال لـ 200 شركة", "حتى 5 بلدان"],
            },
        },
        payment: {
            title: "اختر طريقة الدفع",
            cib: "بطاقة CIB",
            baridimob: "CCP / باريدي موب",
            later: "ادفع لاحقاً",
            descriptions: {
                cib: "دفع آمن عبر الإنترنت ببطاقة CIB",
                baridimob: "تحويل CCP - بريد الجزائر",
                later: "حفظ الحساب والدفع لاحقاً",
            },
            typeTitle: "اختر طريقة الدفع", // AR
            fullPayment: "الدفع الكامل",
            partialPayment: "الدفع على دفعتين",
            fullPaymentDesc: "ادفع المبلغ الكامل الآن واستفد من الخصم",
            partialPaymentDesc: "ادفع 50٪ الآن والباقي بعد تسليم الملف",
            discount: "وفر",
            firstPayment: "الدفعة الأولى",
            secondPayment: "الدفعة الثانية",
            total: "الإجمالي"
        },
        guarantee: "تحميل خطاب الضمان الرسمي",
        guaranteeDesc: "ضمان استرداد 100% في حالة عدم الحصول على رد من الشركات",
        errors: {
            required: "هذا الحقل مطلوب",
            email: "يرجى إدخال عنوان بريد إلكتروني صحيح",
            phone: "يرجى إدخال رقم هاتف صحيح",
            documents: "يرجى تحميل جميع الوثائق المطلوبة",
            offer: "يرجى اختيار عرض",
            payment: "يرجى اختيار طريقة دفع",
        },
        success: "تم التسجيل بنجاح! تم حفظ ملفك.",
        submit: "إرسال",
        submitting: "جاري الإرسال...",
        cancel: "إلغاء",
        save: "حفظ",
        edit: "تعديل",
        delete: "حذف",
        update: "تحديث",
        yes: "نعم",
        no: "لا",
        loading: "جار التحميل...",
        error: "حدث خطأ.",
        successGeneral: "نجاح!",
        notFound: "الصفحة غير موجودة",
        requiredGeneral: "هذا الحقل مطلوب",
        emailGeneral: "البريد الإلكتروني",
        password: "كلمة المرور",
        confirmPassword: "تأكيد كلمة المرور",
        rememberMe: "تذكرني",
        forgotPassword: "هل نسيت كلمة المرور؟",
        alreadyHaveAccount: "لديك حساب بالفعل؟",
        dontHaveAccount: "ليس لديك حساب؟",
        signUp: "إنشاء حساب",
        signIn: "تسجيل الدخول",
        terms: "شروط الاستخدام",
        privacy: "سياسة الخصوصية",
        dashboard: "لوحة التحكم",
        settings: "الإعدادات",
        notifications: "الإشعارات",
        members: "الأعضاء",
        community: "المجتمع",
        resources: "الموارد",
        help: "مساعدة",
        support: "الدعم",
        viewMore: "عرض المزيد",
        viewLess: "عرض أقل",
        postedOn: "تم النشر في",
        by: "بواسطة",
        readMore: "اقرأ المزيد",
        back: "عودة",
        next: "التالي",
        previous: "السابق"
    }
}