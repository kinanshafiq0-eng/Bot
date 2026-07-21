const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const THEME_COLOR = '#0A0A0A';
const activeGames = new Set();

// ==========================================
// قاعدة بيانات فئات ريبيكا (نفسها)
// ==========================================
const rebeccaDatabase = {
    'اسم': [
        'احمد', 'محمد', 'ابراهيم', 'اسماعيل', 'اسامه', 'اياد', 'انس', 'ايوب', 'امين', 'اكرم',
        'بكر', 'بشار', 'باسم', 'بركات', 'بلال', 'بندر',
        'تامر', 'تميم', 'توفيق', 'تركي', 'تيسير',
        'ثامر', 'ثابت', 'ثاقب',
        'جابر', 'جمال', 'جاسر', 'جهاد', 'جواد', 'جرير',
        'حازم', 'حسن', 'حسين', 'حمد', 'حمزة', 'حامد', 'حكمت',
        'خالد', 'خليل', 'خضير', 'خريص',
        'داود', 'دريد', 'دحام', 'داهش',
        'ذياب', 'ذيب', 'ذو الفقار',
        'راشد', 'رامي', 'رائد', 'رباح', 'رجب', 'ركان', 'ريان',
        'زكريا', 'زياد', 'زهير', 'زكي', 'زيد', 'زاهر',
        'سالم', 'سامر', 'سعيد', 'سلمان', 'سليمان', 'سلطان', 'سامح', 'سراج',
        'شاكر', 'شريف', 'شهاب', 'شوقي', 'شعيفان',
        'صالح', 'صقر', 'صلاح', 'صفوان', 'صباح',
        'ضياء', 'ضاحي', 'ضرار', 'ظافر', 'ظهير',
        'عادل', 'عارف', 'عامر', 'عبدالله', 'عبدالرحمن', 'علي', 'عمر', 'عثمان', 'عصام',
        'غالب', 'غسان', 'غيث', 'غلام',
        'فارس', 'فادي', 'فؤاد', 'فهد', 'فيصل', 'فرحان', 'فوزي',
        'قاسم', 'قصي', 'قيس', 'قطب',
        'كامران', 'كريم', 'كمال', 'كثير',
        'لؤي', 'ليث', 'لقمان', 'لطفي',
        'ماجد', 'مالك', 'ماهر', 'محمد', 'محمود', 'مصطفى', 'معاذ', 'منصور', 'مهند',
        'ناجي', 'نادر', 'ناصر', 'نبيل', 'نجم', 'نواف', 'نوح',
        'هاني', 'هاشم', 'هيثم', 'هشام', 'هلال',
        'وائل', 'وجدي', 'وحيد', 'وديع', 'وليد',
        'ياسر', 'يحيى', 'يزيد', 'يعقوب', 'يوسف', 'يونس'
    ],
    'حيوان': [
        'ارنب', 'اسد', 'افعى', 'ايل', 'اتان',
        'بطريق', 'بقر', 'باز', 'ببغاء', 'ببر',
        'تمساح', 'تنين', 'تيس',
        'ثعلب', 'ثور', 'ثعبان',
        'جمل', 'جيربوع', 'جاموس', 'جرو', 'جواد',
        'حصان', 'حمار', 'حوت', 'حرباء', 'حمام', 'حجل',
        'خروف', 'خنزير', 'خيل', 'خلد', 'خطاف',
        'دب', 'دلفين', 'دجاج', 'ديوك', 'دبور',
        'ذئب', 'ذباب',
        'راكون', 'رنة', 'رفراف',
        'زرافة', 'زنبور', 'زبابة',
        'سنجاب', 'سمك', 'سرطان', 'سلاحف', 'سبع',
        'شاهين', 'شمبانزي',
        'صقر', 'صائد',
        'ضفدع', 'ضب', 'ضبع',
        'ظبي', 'ظربان',
        'عجل', 'عصفور', 'عقرب', 'عنكبوت', 'غراب',
        'غزال', 'غرنوق',
        'فيل', 'فهد', 'فار', 'فلامنجو', 'فقمة',
        'قرد', 'قط', 'قنفذ', 'قطرس', 'قندس',
        'كلب', 'كوالا', 'كنغر',
        'لقلق', 'لاما',
        'ماعز', 'نمر', 'نسر', 'ناقة', 'نحلة', 'نعامة', 'نورس',
        'هدهد', 'هامستر',
        'وعل', 'وبر', 'ورل',
        'يمام', 'يعسوب', 'يربوع'
    ],
    'نبات': [
        'ارز', 'اناناس', 'افوكادو',
        'بصل', 'برتقال', 'بطاطس', 'بامية', 'بروكلي', 'باذنجان', 'بلح',
        'تفاح', 'تمر', 'ترمس', 'تين',
        'ثوم',
        'جزر', 'جوافة', 'جوز', 'جرجير',
        'حمص', 'حلبة', 'حرمل', 'حبق', 'حناء',
        'خيار', 'خس', 'خوخ', 'خردل', 'خيزران',
        'دراق', 'دخن', 'دباء',
        'ذرة',
        'رمان', 'ريحان', 'رشاد',
        'زيتون', 'زعتر', 'زعفران', 'زنجبيل',
        'سبانخ', 'سماق', 'سنديان',
        'شومر', 'شعير', 'شاي', 'شمام', 'شمندر',
        'صبار', 'صندل',
        'عنب', 'عدس', 'عجوة',
        'غار',
        'فراولة', 'فجل', 'فول', 'فستق', 'فلفل', 'فطر',
        'قمح', 'قصب', 'قرع', 'قرفة', 'قرنفل',
        'كرفس', 'كوسا', 'كمون', 'كاكا', 'كرز',
        'ليمون', 'لفت', 'لوز', 'لبان',
        'موز', 'مانجو', 'ملفوف', 'نعناع', 'ملوخية', 'ميرمية',
        'نخيل', 'نرجس',
        'هيل', 'هليون',
        'يانسون', 'يقطين'
    ],
    'جماد': [
        'ابريق', 'اسفنج', 'اسوارة', 'الماس',
        'باب', 'برطمان', 'برج', 'برواز', 'بطانية', 'بلوزة', 'برميل', 'بوصلة',
        'تاج', 'تلفزيون', 'تمثال',
        'ثوب', 'ثلاجة', 'ثريا',
        'جدار', 'جسر', 'جهاز', 'جريدة', 'جزمة',
        'حذاء', 'حائط', 'حزام', 'حبل', 'حاسوب', 'حقيبة',
        'خاتم', 'خزانة', 'خشبة', 'خيمة', 'خيط',
        'درج', 'دلو', 'دبوس', 'دراجة', 'درع',
        'ذهب', 'درهم',
        'راديو', 'رسالة', 'رمح',
        'زجاج', 'زر', 'زبرجد',
        'سرير', 'ساعة', 'سيارة', 'سجادة', 'سيف', 'سلك', 'سلسلة', 'ستارة',
        'شباك', 'شاشة', 'شوكة', 'شمعدان', 'شمعة', 'شارع',
        'صندوق', 'صنبور', 'صاروخ', 'صينية', 'صخرة', 'صابون',
        'طاولة', 'طبلة', 'طائرة', 'طوق',
        'ظرف', 'ظلال',
        'عصا', 'عقد', 'عربة', 'علم', 'عطر',
        'غسالة', 'غطاء', 'غرفة',
        'فأس', 'فنجان', 'فرن', 'فرشاة', 'فازة', 'فستان',
        'قلم', 'قفل', 'قدر', 'قميص', 'قارب',
        'كتاب', 'كرسي', 'كأس', 'كمبيوتر', 'مكتب',
        'لابتوب', 'لعبة', 'لوحة',
        'مفتاح', 'مصباح', 'مروحة', 'منشفة', 'مقص', 'محفظة', 'مرآة', 'ملعقة',
        'نظارة', 'نجفة',
        'هاتف', 'هودي', 'هرم',
        'وسادة', 'ورقة', 'وسام',
        'يخت'
    ],
    'بلاد': [
        'اردن', 'اسبانيا', 'امريكا', 'المانيا', 'ايطاليا', 'ايران', 'استراليا', 'امارات', 'اسكتلندا',
        'بريطانيا', 'بلجيكا', 'بلغاريا', 'بحرين', 'بروناي', 'بنغلاديش',
        'تركيا', 'تونس', 'تشاد', 'تشيلي', 'تايلاند', 'تنزانيا', 'تايوان',
        'جزائر', 'جامايكا', 'جورجيا', 'جيبوتي',
        'هند', 'هونغ كونغ',
        'دانمارك',
        'رومانيا', 'روسيا', 'رواندا',
        'زيمبابوي', 'زامبيا',
        'سعودية', 'سودان', 'سوريا', 'سويد', 'سويسرا', 'سنغافورة', 'سنغال', 'صومال',
        'صين', 'صربيا',
        'عراق', 'عمان',
        'فرنسا', 'فلبين', 'فنزويلا', 'فنلندا', 'فلسطين', 'فيتنام',
        'قبرص', 'قطر',
        'كندا', 'كويت', 'كولومبيا', 'كوبا', 'كامرون', 'كرواتيا', 'كينيا',
        'لبنان', 'ليبي', 'لتوانيا', 'ليبيريا',
        'مصر', 'مغرب', 'موريتانيا', 'ماليزيا', 'مالطا', 'مكسيك', 'منغوليا', 'مدغشقر',
        'نرويج', 'نمسا', 'نيبال', 'نيجر', 'نيجيريا', 'نيوزيلندا',
        'هندوراس', 'هنغاريا', 'هولندا',
        'يمن', 'يونان', 'وغندا'
    ]
};

// ==========================================
// قاعدة بيانات 80 دولة مع أعلام وصور (تم إضافة 40 دولة جديدة)
// ==========================================
const worldCountriesDatabase = [
    // الدول العربية والأوروبية والأمريكية الأساسية (40 دولة موجودة مسبقاً)
    { name: 'الاردن', lat: 31.95, lon: 35.91, hint: 'بلد عربي يشتهر بمدينة البتراء الأثرية', flag: 'https://flagcdn.com/jo.svg', images: [
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'فلسطين', lat: 31.90, lon: 35.20, hint: 'مهد الديانات وعاصمة التاريخ والصمود', flag: 'https://flagcdn.com/ps.svg', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'مصر', lat: 30.04, lon: 31.23, hint: 'بلد الأهرامات ونهر النيل الخالد', flag: 'https://flagcdn.com/eg.svg', images: [
        'https://images.unsplash.com/photo-1539785876258-0043141e05a3?w=800', 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', 'https://images.unsplash.com/photo-1568322445167-e9aef09a9638?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800'
    ]},
    { name: 'السعودية', lat: 24.71, lon: 46.67, hint: 'قلب العالم الإسلامي وبلاد الحرمين الشريفين', flag: 'https://flagcdn.com/sa.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'الإمارات', lat: 24.45, lon: 54.37, hint: 'تضم أطول برج في العالم وواحة ناطحات السحاب', flag: 'https://flagcdn.com/ae.svg', images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1526495124233-a0af41858376?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'فرنسا', lat: 48.85, lon: 2.35, hint: 'عاصمة الموضة وبرج إيفل الشهير', flag: 'https://flagcdn.com/fr.svg', images: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1509439573887-01e76b4d2c0b?w=800', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800'
    ]},
    { name: 'بريطانيا', lat: 51.50, lon: -0.12, hint: 'بلد الساعة الكبرى بيج بن ونهر التمز', flag: 'https://flagcdn.com/gb.svg', images: [
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'
    ]},
    { name: 'اليابان', lat: 35.67, lon: 139.65, hint: 'بلاد الساموراي وأزهار الساكورا والتكنولوجيا', flag: 'https://flagcdn.com/jp.svg', images: [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'تركيا', lat: 41.00, lon: 28.97, hint: 'ملتقى القارات ومعالم إسطنبول العريقة', flag: 'https://flagcdn.com/tr.svg', images: [
        'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', 'https://images.unsplash.com/photo-1527838832700-505925257cb7?w=800', 'https://images.unsplash.com/photo-1569383749723-942ad26fc546?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'
    ]},
    { name: 'ايطاليا', lat: 41.90, lon: 12.49, hint: 'بلد الكولوسيوم والبيتزا والتاريخ الروماني', flag: 'https://flagcdn.com/it.svg', images: [
        'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ]},
    { name: 'المانيا', lat: 52.52, lon: 13.40, hint: 'عاصمة الصناعة وقوة أوروبا الاقتصادية', flag: 'https://flagcdn.com/de.svg', images: [
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800'
    ]},
    { name: 'اسبانيا', lat: 40.41, lon: -3.70, hint: 'بلد الشمس والشواطئ ومعالم مدريد وبرشلونة', flag: 'https://flagcdn.com/es.svg', images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800', 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', 'https://images.unsplash.com/photo-1511527661048-7fa73d8af18g?w=800'
    ]},
    { name: 'امريكا', lat: 38.89, lon: -77.03, hint: 'بلاد العم سام وتمثال الحرية وناطحات السحاب الكبرى', flag: 'https://flagcdn.com/us.svg', images: [
        'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'
    ]},
    { name: 'كندا', lat: 45.42, lon: -75.69, hint: 'بلد الطبيعة الخلابة وأوراق الشجر القيقبية', flag: 'https://flagcdn.com/ca.svg', images: [
        'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800', 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800', 'https://images.unsplash.com/photo-1508193638397-1c42f9db1780?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'البرازيل', lat: -15.79, lon: -47.88, hint: 'موطن كرة القدم وغابات الأمازون وراميو السامبا', flag: 'https://flagcdn.com/br.svg', images: [
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800', 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800', 'https://images.unsplash.com/photo-1508873696983-2df5c920aac9?w=800'
    ]},
    { name: 'الصين', lat: 39.90, lon: 116.40, hint: 'بلد سور الصين العظيم والتاريخ العريق', flag: 'https://flagcdn.com/cn.svg', images: [
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800', 'https://images.unsplash.com/photo-1578469550956-15cc9d5df96c?w=800', 'https://images.unsplash.com/photo-1599839575945-a9e9afbc135d?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'الهند', lat: 28.61, lon: 77.20, hint: 'بلد تاج محل والثقافات المتنوعة والألوان الزاهية', flag: 'https://flagcdn.com/in.svg', images: [
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 'https://images.unsplash.com/photo-1522885147699-6faa2093530d?w=800', 'https://images.unsplash.com/photo-1592635199204-a953c6d66e74?w=800'
    ]},
    { name: 'كوريا الجنوبية', lat: 37.56, lon: 126.97, hint: 'بلد الثقافة الحديثة وقصور سيول والتكنولوجيا', flag: 'https://flagcdn.com/kr.svg', images: [
        'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1548113251-f5e71d36d49f?w=800'
    ]},
    { name: 'الأرجنتين', lat: -34.60, lon: -58.38, hint: 'موطن التانجو ونجوم كرة القدم في أمريكا الجنوبية', flag: 'https://flagcdn.com/ar.svg', images: [
        'https://images.unsplash.com/photo-1589909202874-1789fd59f0d2?w=800', 'https://images.unsplash.com/photo-1612294037637-ec32080dcfb4?w=800', 'https://images.unsplash.com/photo-1531816433857-463287d3a8a9?w=800', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', 'https://images.unsplash.com/photo-1533929736458-ca588d58c8be?w=800'
    ]},
    { name: 'المكسيك', lat: 19.43, lon: -99.13, hint: 'بلد الحضارات القديمة والأهرامات الأمريكية والمأكولات الشهيرة', flag: 'https://flagcdn.com/mx.svg', images: [
        'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800'
    ]},
    { name: 'إندونيسيا', lat: -6.20, lon: 106.84, hint: 'أكبر دولة إسلامية من حيث السكان وتضم جزر بالي الساحرة', flag: 'https://flagcdn.com/id.svg', images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', 'https://images.unsplash.com/photo-1555899467-f0c3dab653a9?w=800', 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800'
    ]},
    { name: 'هندوراس', lat: 14.07, lon: -87.20, hint: 'بلد في أمريكا الوسطى يشتهر بآثار المايا والشواطئ الكاريبية', flag: 'https://flagcdn.com/hn.svg', images: [
        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800'
    ]},
    { name: 'كوريا الشمالية', lat: 39.03, lon: 125.75, hint: 'دولة ذات طبيعة جبلية صارمة وعاصمة بيونغ يانغ', flag: 'https://flagcdn.com/kp.svg', images: [
        'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'
    ]},
    { name: 'السويد', lat: 59.32, lon: 18.06, hint: 'بلد إسكندنافي يشتهر بالغابات والبحيرات وتصميم الطبيعة الخلابة', flag: 'https://flagcdn.com/se.svg', images: [
        'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1527788313554-dcd17b732442?w=800', 'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800'
    ]},
    { name: 'نرويج', lat: 59.91, lon: 10.75, hint: 'بلد المضايق البحرية العميقة والأضواء الشمالية الشفق القطبي', flag: 'https://flagcdn.com/no.svg', images: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800', 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'الجزائر', lat: 36.75, lon: 3.05, hint: 'بلد المليون شهيد وأكبر دولة عربية مساحة مع معالم الصحراء الكبرى', flag: 'https://flagcdn.com/dz.svg', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'المغرب', lat: 33.97, lon: -6.84, hint: 'بلد الألوان والأسواق التاريخية وجبال الأطلس وعاصمة الرباط', flag: 'https://flagcdn.com/ma.svg', images: [
        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800', 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'
    ]},
    { name: 'تونس', lat: 36.80, lon: 10.18, hint: 'بلد الآثار القرطاجية والشواطئ المتوسطية الساحرة', flag: 'https://flagcdn.com/tn.svg', images: [
        'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', 'https://images.unsplash.com/photo-1527838832700-505925257cb7?w=800', 'https://images.unsplash.com/photo-1569383749723-942ad26fc546?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800'
    ]},
    { name: 'العراق', lat: 33.31, lon: 44.36, hint: 'بلد بلاد ما بين النهرين والتاريخ الحضاري العريق وبابل', flag: 'https://flagcdn.com/iq.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'سوريا', lat: 33.51, lon: 36.29, hint: 'بلد الياسمين ودمشق العاصمة الأقدم في التاريخ', flag: 'https://flagcdn.com/sy.svg', images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'لبنان', lat: 33.89, lon: 35.50, hint: 'بلد الأرز وطبيعة بيروت الساحرة ومعالمها العريقة', flag: 'https://flagcdn.com/lb.svg', images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'الكويت', lat: 29.37, lon: 47.97, hint: 'دولة الخليج العربي وتشتهر بأبراج الكويت الشهيرة', flag: 'https://flagcdn.com/kw.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'قطر', lat: 25.28, lon: 51.53, hint: 'بلد اللؤلؤ ونهضة الدوحة الحديثة واستضافة المونديال', flag: 'https://flagcdn.com/qa.svg', images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1526495124233-a0af41858376?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'البحرين', lat: 26.06, lon: 50.55, hint: 'لؤلؤة الخليج وجزر الدار والتاريخ العريق', flag: 'https://flagcdn.com/bh.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'عمان', lat: 23.58, lon: 58.38, hint: 'سلطنة الجبال والشواطئ النظيفة والقلاع التاريخية', flag: 'https://flagcdn.com/om.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800'
    ]},
    { name: 'اليونان', lat: 37.98, lon: 23.72, hint: 'مهد الحضارة الغربية والجزر البيضاء الساحرة في البحر المتوسط', flag: 'https://flagcdn.com/gr.svg', images: [
        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd138?w=800'
    ]},
    { name: 'هولندا', lat: 52.36, lon: 4.90, hint: 'بلد طواحين الهواء وقنوات أمستردام المائية وحقول الزهور', flag: 'https://flagcdn.com/nl.svg', images: [
        'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800', 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800'
    ]},
    { name: 'سويسرا', lat: 46.94, lon: 7.44, hint: 'بلد الجبال السويسرية الشهيرة والشوكولاتة الفاخرة والساعات العريقة', flag: 'https://flagcdn.com/ch.svg', images: [
        'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800', 'https://images.unsplash.com/photo-1527668752066-b4a2fc01e61f?w=800', 'https://images.unsplash.com/photo-1502101872923-d48509bff386?w=800', 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
    ]},
    { name: 'البرتغال', lat: 38.72, lon: -9.13, hint: 'بلد المستكشفين والشواطئ الأطلسية الساحرة في شبه الجزيرة الإيبيرية', flag: 'https://flagcdn.com/pt.svg', images: [
        'https://images.unsplash.com/photo-1513581166391-8f6a97fc92a2?w=800', 'https://images.unsplash.com/photo-1548711645-2a26569a6c98?w=800', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800'
    ]},
    { name: 'بلجيكا', lat: 50.85, lon: 4.35, hint: 'عاصمة الاتحاد الأوروبي وتشتهر بالشوكولاتة البلجيكية والهندسة المعمارية', flag: 'https://flagcdn.com/be.svg', images: [
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800'
    ]},
    // ===== الدول الجديدة (40 دولة) =====
    { name: 'روسيا', lat: 55.75, lon: 37.62, hint: 'أكبر دولة في العالم مساحةً وعاصمة موسكو', flag: 'https://flagcdn.com/ru.svg', images: [
        'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800', 'https://images.unsplash.com/photo-1541599540907-7a6cd1a4d979?w=800', 'https://images.unsplash.com/photo-1505956999-9d2b9c5e4e4b?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800'
    ]},
    { name: 'أوكرانيا', lat: 50.45, lon: 30.52, hint: 'بلد السهول الخضراء وعاصمتها كييف التاريخية', flag: 'https://flagcdn.com/ua.svg', images: [
        'https://images.unsplash.com/photo-1559819616-57fc12f6ad52?w=800', 'https://images.unsplash.com/photo-1584493481782-5e5092d04f7b?w=800', 'https://images.unsplash.com/photo-1561848784-1a2c7c2a2b2b?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800'
    ]},
    { name: 'بولندا', lat: 52.23, lon: 21.01, hint: 'بلد تاريخي في أوروبا الوسطى وعاصمتها وارسو', flag: 'https://flagcdn.com/pl.svg', images: [
        'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'
    ]},
    { name: 'رومانيا', lat: 44.43, lon: 26.10, hint: 'بلد القلاع والغابات وعاصمتها بوخارست', flag: 'https://flagcdn.com/ro.svg', images: [
        'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800', 'https://images.unsplash.com/photo-1527668752066-b4a2fc01e61f?w=800', 'https://images.unsplash.com/photo-1502101872923-d48509bff386?w=800', 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
    ]},
    { name: 'كازاخستان', lat: 51.18, lon: 71.45, hint: 'أكبر دولة في آسيا الوسطى وعاصمتها نور سلطان', flag: 'https://flagcdn.com/kz.svg', images: [
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800', 'https://images.unsplash.com/photo-1578469550956-15cc9d5df96c?w=800', 'https://images.unsplash.com/photo-1599839575945-a9e9afbc135d?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'أوزبكستان', lat: 41.31, lon: 69.28, hint: 'بلد المدن التاريخية مثل سمرقند وبخارى', flag: 'https://flagcdn.com/uz.svg', images: [
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 'https://images.unsplash.com/photo-1522885147699-6faa2093530d?w=800', 'https://images.unsplash.com/photo-1592635199204-a953c6d66e74?w=800'
    ]},
    { name: 'باكستان', lat: 33.68, lon: 73.04, hint: 'بلد الجبال العالية والثقافات المتنوعة وعاصمتها إسلام أباد', flag: 'https://flagcdn.com/pk.svg', images: [
        'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1548113251-f5e71d36d49f?w=800'
    ]},
    { name: 'نيجيريا', lat: 9.06, lon: 7.49, hint: 'أكبر دولة في أفريقيا من حيث السكان وعاصمتها أبوجا', flag: 'https://flagcdn.com/ng.svg', images: [
        'https://images.unsplash.com/photo-1589909202874-1789fd59f0d2?w=800', 'https://images.unsplash.com/photo-1612294037637-ec32080dcfb4?w=800', 'https://images.unsplash.com/photo-1531816433857-463287d3a8a9?w=800', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', 'https://images.unsplash.com/photo-1533929736458-ca588d58c8be?w=800'
    ]},
    { name: 'جنوب أفريقيا', lat: -25.75, lon: 28.23, hint: 'بلد التنوع الطبيعي وعاصمتها بريتوريا', flag: 'https://flagcdn.com/za.svg', images: [
        'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800'
    ]},
    { name: 'كينيا', lat: -1.29, lon: 36.82, hint: 'بلد السافانا والحياة البرية وعاصمتها نيروبي', flag: 'https://flagcdn.com/ke.svg', images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', 'https://images.unsplash.com/photo-1555899467-f0c3dab653a9?w=800', 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800'
    ]},
    { name: 'إثيوبيا', lat: 9.03, lon: 38.74, hint: 'بلد الحضارة القديمة والكنائس المنحوتة في الصخر', flag: 'https://flagcdn.com/et.svg', images: [
        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800'
    ]},
    { name: 'تنزانيا', lat: -6.17, lon: 35.74, hint: 'بلد جبل كليمنجارو ومحميات الحياة البرية', flag: 'https://flagcdn.com/tz.svg', images: [
        'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'
    ]},
    { name: 'فيتنام', lat: 21.03, lon: 105.85, hint: 'بلد الخلجان الخضراء والثقافة الغنية وعاصمتها هانوي', flag: 'https://flagcdn.com/vn.svg', images: [
        'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1527788313554-dcd17b732442?w=800', 'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800'
    ]},
    { name: 'تايلاند', lat: 13.75, lon: 100.50, hint: 'بلد المعابد والشواطئ الاستوائية وعاصمتها بانكوك', flag: 'https://flagcdn.com/th.svg', images: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800', 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'ماليزيا', lat: 3.14, lon: 101.69, hint: 'بلد الغابات المطيرة وناطحات السحاب وعاصمتها كوالالمبور', flag: 'https://flagcdn.com/my.svg', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'الفلبين', lat: 14.60, lon: 120.98, hint: 'بلد الجزر الاستوائية والشواطئ الجميلة', flag: 'https://flagcdn.com/ph.svg', images: [
        'https://images.unsplash.com/photo-1539785876258-0043141e05a3?w=800', 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', 'https://images.unsplash.com/photo-1568322445167-e9aef09a9638?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800'
    ]},
    { name: 'بيرو', lat: -12.06, lon: -77.04, hint: 'موطن إمبراطورية الإنكا وماتشو بيتشو', flag: 'https://flagcdn.com/pe.svg', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'تشيلي', lat: -33.45, lon: -70.66, hint: 'بلد الضيق الطويل في أمريكا الجنوبية وعاصمتها سانتياغو', flag: 'https://flagcdn.com/cl.svg', images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1526495124233-a0af41858376?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'كولومبيا', lat: 4.60, lon: -74.08, hint: 'بلد القهوة والتنوع الطبيعي وعاصمتها بوغوتا', flag: 'https://flagcdn.com/co.svg', images: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1509439573887-01e76b4d2c0b?w=800', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800'
    ]},
    { name: 'فنزويلا', lat: 10.48, lon: -66.90, hint: 'بلد شلالات الملاك والنفط وعاصمتها كراكاس', flag: 'https://flagcdn.com/ve.svg', images: [
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'
    ]},
    { name: 'نيوزيلندا', lat: -41.28, lon: 174.77, hint: 'بلد الجمال الطبيعي والمناظر الخلابة والماوري', flag: 'https://flagcdn.com/nz.svg', images: [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'أستراليا', lat: -35.28, lon: 149.13, hint: 'بلد الكنغر والكوالا والشواطئ الذهبية', flag: 'https://flagcdn.com/au.svg', images: [
        'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', 'https://images.unsplash.com/photo-1527838832700-505925257cb7?w=800', 'https://images.unsplash.com/photo-1569383749723-942ad26fc546?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'
    ]},
    { name: 'إيران', lat: 35.69, lon: 51.39, hint: 'بلد الحضارة الفارسية القديمة وعاصمتها طهران', flag: 'https://flagcdn.com/ir.svg', images: [
        'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ]},
    { name: 'أفغانستان', lat: 34.53, lon: 69.17, hint: 'بلد الجبال الوعرة والتاريخ العريق وعاصمتها كابول', flag: 'https://flagcdn.com/af.svg', images: [
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800'
    ]},
    { name: 'نيبال', lat: 27.70, lon: 85.32, hint: 'بلد جبل إيفرست والثقافة الهندوسية', flag: 'https://flagcdn.com/np.svg', images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800', 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', 'https://images.unsplash.com/photo-1511527661048-7fa73d8af18g?w=800'
    ]},
    { name: 'بنغلاديش', lat: 23.81, lon: 90.41, hint: 'بلد الأنهار والمزارع الخضراء وعاصمتها دكا', flag: 'https://flagcdn.com/bd.svg', images: [
        'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'
    ]},
    { name: 'ميانمار', lat: 19.76, lon: 96.08, hint: 'بلد الباغودات الذهبية وعاصمتها نايبيداو', flag: 'https://flagcdn.com/mm.svg', images: [
        'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800', 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800', 'https://images.unsplash.com/photo-1508193638397-1c42f9db1780?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'سريلانكا', lat: 6.93, lon: 79.85, hint: 'جوهرة المحيط الهندي والشواطئ الاستوائية', flag: 'https://flagcdn.com/lk.svg', images: [
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800', 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800', 'https://images.unsplash.com/photo-1508873696983-2df5c920aac9?w=800'
    ]},
    { name: 'ليبيا', lat: 32.88, lon: 13.19, hint: 'بلد الصحراء والآثار الرومانية وعاصمتها طرابلس', flag: 'https://flagcdn.com/ly.svg', images: [
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800', 'https://images.unsplash.com/photo-1578469550956-15cc9d5df96c?w=800', 'https://images.unsplash.com/photo-1599839575945-a9e9afbc135d?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'السودان', lat: 15.59, lon: 32.54, hint: 'بلد النيلين والتنوع الثقافي وعاصمتها الخرطوم', flag: 'https://flagcdn.com/sd.svg', images: [
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 'https://images.unsplash.com/photo-1522885147699-6faa2093530d?w=800', 'https://images.unsplash.com/photo-1592635199204-a953c6d66e74?w=800'
    ]},
    { name: 'اليمن', lat: 15.36, lon: 44.20, hint: 'بلد الحضارة السبئية ومدينة صنعاء القديمة', flag: 'https://flagcdn.com/ye.svg', images: [
        'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1548113251-f5e71d36d49f?w=800'
    ]},
    { name: 'الصومال', lat: 2.04, lon: 45.34, hint: 'بلد القرن الأفريقي وعاصمتها مقديشو', flag: 'https://flagcdn.com/so.svg', images: [
        'https://images.unsplash.com/photo-1589909202874-1789fd59f0d2?w=800', 'https://images.unsplash.com/photo-1612294037637-ec32080dcfb4?w=800', 'https://images.unsplash.com/photo-1531816433857-463287d3a8a9?w=800', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', 'https://images.unsplash.com/photo-1533929736458-ca588d58c8be?w=800'
    ]},
    { name: 'جيبوتي', lat: 11.59, lon: 43.15, hint: 'بلد مضيق باب المندب والبحيرات المالحة', flag: 'https://flagcdn.com/dj.svg', images: [
        'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800'
    ]},
    { name: 'إريتريا', lat: 15.33, lon: 38.93, hint: 'بلد السواحل الإفريقية وعاصمتها أسمرة', flag: 'https://flagcdn.com/er.svg', images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', 'https://images.unsplash.com/photo-1555899467-f0c3dab653a9?w=800', 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800'
    ]},
    { name: 'غانا', lat: 5.60, lon: -0.19, hint: 'بلد الساحل الذهبي والتاريخ الأفريقي العريق', flag: 'https://flagcdn.com/gh.svg', images: [
        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800'
    ]},
    { name: 'السنغال', lat: 14.69, lon: -17.44, hint: 'بلد الغروب الجميل وعاصمتها داكار', flag: 'https://flagcdn.com/sn.svg', images: [
        'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'
    ]},
    { name: 'مالي', lat: 12.65, lon: -8.00, hint: 'بلد التمبكتو والصحراء الكبرى', flag: 'https://flagcdn.com/ml.svg', images: [
        'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1527788313554-dcd17b732442?w=800', 'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800'
    ]},
    { name: 'النيجر', lat: 13.51, lon: 2.12, hint: 'بلد الصحراء الكبرى وعاصمتها نيامي', flag: 'https://flagcdn.com/ne.svg', images: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800', 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'تشاد', lat: 12.13, lon: 15.05, hint: 'بلد بحيرة تشاد والسهول الواسعة', flag: 'https://flagcdn.com/td.svg', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'الكاميرون', lat: 3.85, lon: 11.50, hint: 'بلد إفريقيا الصغيرة وعاصمتها ياوندي', flag: 'https://flagcdn.com/cm.svg', images: [
        'https://images.unsplash.com/photo-1539785876258-0043141e05a3?w=800', 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', 'https://images.unsplash.com/photo-1568322445167-e9aef09a9638?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800'
    ]}
];

// دالة لتنظيف وتوحيد الحروف العربية للمقارنة الصحيحة
function cleanArabic(text) {
    if (!text) return '';
    return text.trim()
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064b-\u0652]/g, '');
}

client.on('ready', () => {
    console.log(`✅ Bot Logged in as ${client.user.tag}!`);
    client.user.setActivity('!اختباء أو !كراسي أو !ريبيكا أو !تخمين | ساحة الظلام', { type: 3 });
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const prefix = '!';
    const guildId = message.guild.id;

    // ==========================================
    // 1. لعبة الاختباء (25 صندوق - تدمير عشوائي)
    // ==========================================
    if (message.content === prefix + 'اختباء' || message.content === prefix + 'hide') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة الاختباء الكبرى')
            .setDescription(`انضم إلى الساحة، والبقاء للأذكى.\n\n⏳ **تبدأ المواجهة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('hide_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('hide_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'hide_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true, hidingSpot: null });
                }
                await interaction.reply({ content: 'تم انضمامك بنجاح.', ephemeral: true });
            } else if (interaction.customId === 'hide_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            try {
                const renderBoxesRows = (disabled = false, boxStatusMap = {}) => {
                    let rows = [];
                    for (let r = 0; r < 5; r++) {
                        let rowComponents = [];
                        for (let c = 0; c < 5; c++) {
                            let boxNum = r * 5 + c + 1;
                            let status = boxStatusMap[boxNum]; 
                            
                            let btnStyle = ButtonStyle.Secondary;
                            if (status === 'hit') btnStyle = ButtonStyle.Success;  
                            else if (status === 'safe') btnStyle = ButtonStyle.Danger;  

                            rowComponents.push(
                                new ButtonBuilder()
                                    .setCustomId(`box_${boxNum}`)
                                    .setLabel(`${boxNum}`)
                                    .setStyle(btnStyle)
                                    .setDisabled(disabled || status !== undefined)
                            );
                        }
                        rows.push(new ActionRowBuilder().addComponents(rowComponents));
                    }
                    return rows;
                };

                const hideEmbed = new EmbedBuilder()
                    .setTitle('◇ مرحلة التخفي')
                    .setDescription(`اختر صندوقاً من الـ 25 لتختبئ فيه.\n⏳ **الوقت:** 12 ثانية`);

                let hideMsg = await message.channel.send({ content: `🔹 **اختر مكان اختبائك الآن:**`, embeds: [hideEmbed], components: renderBoxesRows(false, {}) });

                let hideCollector = hideMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 12000 });

                hideCollector.on('collect', async i => {
                    let player = playersMap.get(i.user.id);
                    if (!player) return i.reply({ content: 'لست مشاركاً.', ephemeral: true });
                    if (player.hidingSpot !== null) return i.reply({ content: `اخترت مسبقاً [${player.hidingSpot}].`, ephemeral: true });

                    let boxNum = parseInt(i.customId.split('_')[1]);
                    player.hidingSpot = boxNum;
                    await i.reply({ content: `اختبأت في الصندوق [${boxNum}].`, ephemeral: true });
                });

                hideCollector.on('end', async () => {
                    for (let player of playersArr) {
                        if (player.hidingSpot === null) {
                            player.hidingSpot = Math.floor(Math.random() * 25) + 1;
                        }
                    }
                });

                await new Promise(res => setTimeout(res, 13000));
                await hideMsg.edit({ content: `🔒 **بدأت مرحلة التدمير..**`, components: [] }).catch(() => {});

                let boxStatusMap = {}; 
                let turnIndex = 0;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    let currentPlayer = alivePlayers[turnIndex % alivePlayers.length];

                    let turnEmbed = new EmbedBuilder()
                        .setTitle('◇ جولة التدمير')
                        .setDescription(`دور اللاعب: <@${currentPlayer.id}>\nاختر صندوقاً لتفجيره.\n⏳ **الوقت:** 10 ثوانٍ`)
                        .setColor(THEME_COLOR);

                    let turnMsg = await message.channel.send({ content: `<@${currentPlayer.id}> دورك الآن:`, embeds: [turnEmbed], components: renderBoxesRows(false, boxStatusMap) });

                    let turnCollector = turnMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 10000 });
                    let actionTaken = false;

                    turnCollector.on('collect', async i => {
                        if (i.user.id !== currentPlayer.id) {
                            return i.reply({ content: 'ليس دورك.', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);
                        if (boxStatusMap[targetBox] !== undefined) {
                            return i.reply({ content: 'مفجر مسبقاً.', ephemeral: true });
                        }

                        actionTaken = true;
                        turnCollector.stop();

                        let caughtPlayers = playersArr.filter(p => p.alive && p.hidingSpot === targetBox);
                        
                        if (caughtPlayers.length > 0) {
                            boxStatusMap[targetBox] = 'hit'; 
                        } else {
                            boxStatusMap[targetBox] = 'safe'; 
                        }

                        let resultText = `💥 تم تفجير الصندوق **[${targetBox}]** بواسطة <@${currentPlayer.id}>\n`;
                        let pingContent = "";

                        if (caughtPlayers.length > 0) {
                            let pingList = caughtPlayers.map(cp => `<@${cp.id}>`).join(' ');
                            pingContent = `🚨 **خسارة وإقصاء:** ${pingList}`;
                            for (let cp of caughtPlayers) {
                                cp.alive = false;
                                resultText += `تم كشف وإقصاء: <@${cp.id}>\n`;
                            }
                        } else {
                            resultText += `الصندوق كان فارغاً وصامداً.`;
                        }

                        await i.update({ 
                            content: pingContent || null,
                            embeds: [new EmbedBuilder().setDescription(resultText).setColor(THEME_COLOR)], 
                            components: renderBoxesRows(true, boxStatusMap) 
                        });
                    });

                    turnCollector.on('end', async () => {
                        if (!actionTaken) {
                            let available = [];
                            for(let i=1; i<=25; i++) if(boxStatusMap[i] === undefined) available.push(i);
                            if (available.length > 0) {
                                let randomBox = available[Math.floor(Math.random() * available.length)];
                                
                                let caught = playersArr.filter(p => p.alive && p.hidingSpot === randomBox);
                                if (caught.length > 0) {
                                    boxStatusMap[randomBox] = 'hit';
                                } else {
                                    boxStatusMap[randomBox] = 'safe';
                                }

                                let text = `⏳ انتهى وقت <@${currentPlayer.id}>.. تم تفجير [${randomBox}] تلقائياً.\n`;
                                let pingContent = "";

                                if (caught.length > 0) {
                                    let pingList = caught.map(cp => `<@${cp.id}>`).join(' ');
                                    pingContent = `🚨 **إقصاء لانتهاء الوقت:** ${pingList}`;
                                    for (let cp of caught) {
                                        cp.alive = false;
                                        text += `تم إقصاء اللاعب: <@${cp.id}>\n`;
                                    }
                                }

                                await turnMsg.edit({ 
                                    content: pingContent || null,
                                    embeds: [new EmbedBuilder().setDescription(text).setColor(THEME_COLOR)], 
                                    components: renderBoxesRows(true, boxStatusMap) 
                                }).catch(()=>{});
                            }
                        }
                    });

                    await new Promise(res => setTimeout(res, 11000));

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameActive = false;
                        break;
                    }

                    turnIndex++;
                }

                let survivingPlayers = playersArr.filter(p => p.alive);
                const finalEmbed = new EmbedBuilder().setColor(THEME_COLOR);

                if (survivingPlayers.length === 1) {
                    finalEmbed.setTitle('◆ نهاية المعركة')
                    .setDescription(`👑 الناجي الفائز:\n<@${survivingPlayers[0].id}> ✨`);
                    await message.channel.send({ content: `👑 مبارك الفوز <@${survivingPlayers[0].id}>!`, embeds: [finalEmbed] });
                } else {
                    finalEmbed.setTitle('◆ نهاية المعركة')
                    .setDescription(`👑 الناجون:\n` + survivingPlayers.map(p => `<@${p.id}>`).join('\n'));
                    let pings = survivingPlayers.map(p => `<@${p.id}>`).join(' ');
                    await message.channel.send({ content: `👑 الناجون: ${pings}`, embeds: [finalEmbed] });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }

    // ==========================================
    // 2. لعبة الكراسي الموسيقية
    // ==========================================
    if (message.content === prefix + 'كراسي' || message.content === prefix + 'chairs') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة الكراسي الموسيقية')
            .setDescription(`انضم إلى الساحة، والبقاء للأسرع.\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('chair_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('chair_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'chair_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true });
                }
                await interaction.reply({ content: 'تم انضمامك.', ephemeral: true });
            } else if (interaction.customId === 'chair_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 2) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم اكتمال اللاعبين (يجب 2 على الأقل).', embeds: [], components: [] });
            }

            try {
                let roundNumber = 1;
                let gameActive = true;

                while (gameActive) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 1) break;

                    let chairCount = alivePlayers.length - 1;
                    if (chairCount < 1) chairCount = 1;

                    let totalBoxes = chairCount; 
                    let roundState = {}; 
                    let redRoundLosers = []; 
                    let isRoundRed = Math.random() < 0.3; 

                    const renderChairRows = (disabled = false, showColors = false) => {
                        let rows = [];
                        let currentRow = new ActionRowBuilder();
                        
                        for (let i = 1; i <= totalBoxes; i++) {
                            let isTaken = Object.values(roundState).includes(i);
                            let btnStyle = ButtonStyle.Secondary; 
                            let btnLabel = `كرسي ${i}`;
                            let isDisabled = disabled;

                            if (showColors) {
                                if (isRoundRed) {
                                    btnStyle = ButtonStyle.Danger; 
                                    btnLabel = `✕ ${i}`;
                                } else if (isTaken) {
                                    btnStyle = ButtonStyle.Success; 
                                    btnLabel = `✓ ${i}`;
                                } else {
                                    btnStyle = ButtonStyle.Primary; 
                                    btnLabel = `كرسي ${i}`;
                                }
                            } else {
                                if (isTaken) {
                                    btnStyle = ButtonStyle.Success; 
                                    btnLabel = `✓ ${i}`;
                                }
                            }

                            currentRow.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`chair_${i}`)
                                    .setLabel(btnLabel)
                                    .setStyle(btnStyle)
                                    .setDisabled(isDisabled || (!showColors && false) || (!isRoundRed && isTaken))
                            );

                            if (currentRow.components.length === 5 || i === totalBoxes) {
                                rows.push(currentRow);
                                currentRow = new ActionRowBuilder();
                            }
                        }
                        return rows;
                    };

                    let roundEmbed = new EmbedBuilder()
                        .setTitle(`◇ جولة الكراسي رقم ${roundNumber}`)
                        .setDescription(`الباقون: **${alivePlayers.length}** | الكراسي: **${chairCount}**\n⏳ **الموسيقى تعمل.. الأزرار تنتظر الكشف!**`)
                        .setColor(THEME_COLOR);

                    let totalRoundTime = 25000;
                    let revealDelay = 15000; 

                    let roundMsg = await message.channel.send({ 
                        content: `🎵 **بدأت الموسيقى.. الكراسي (${chairCount}) لـ (${alivePlayers.length}) مشارك!**`, 
                        embeds: [roundEmbed], 
                        components: renderChairRows(false, false) 
                    });

                    let roundCollector = roundMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: totalRoundTime });

                    setTimeout(async () => {
                        try {
                            let revealDesc = isRoundRed 
                                ? `⚠️ **تنبيه:** انتهت الـ 15 ثانية.. الجولة حمراء (فخ)!` 
                                : `الباقون: **${alivePlayers.length}** | ظهرت الألوان الآن! اسرع بالجلوس!`;
                            
                            let revealEmbed = EmbedBuilder.from(roundEmbed).setDescription(`${revealDesc}\n⏳ **تبقى 10 ثوانٍ!**`);
                            await roundMsg.edit({ embeds: [revealEmbed], components: renderChairRows(false, true) }).catch(()=>{});
                        } catch (e) {}
                    }, revealDelay);

                    roundCollector.on('collect', async i => {
                        let player = playersMap.get(i.user.id);
                        if (!player || !player.alive) {
                            return i.reply({ content: 'لست مشاركاً أو تم إقصاؤك.', ephemeral: true });
                        }

                        let targetBox = parseInt(i.customId.split('_')[1]);

                        if (isRoundRed) {
                            if (!redRoundLosers.includes(player.id)) {
                                redRoundLosers.push(player.id);
                                player.alive = false;
                            }
                            await i.reply({ content: 'جولة حمراء! تم إقصاؤك.', ephemeral: true });
                            return;
                        }

                        if (Object.keys(roundState).includes(i.user.id)) {
                            return i.reply({ content: 'لقد جلست مسبقاً!', ephemeral: true });
                        }
                        if (Object.values(roundState).includes(targetBox)) {
                            return i.reply({ content: 'هذا الكرسي محجوز!', ephemeral: true });
                        }

                        roundState[i.user.id] = targetBox;
                        await i.update({ components: renderChairRows(false, true) });
                    });

                    await new Promise(res => setTimeout(res, totalRoundTime));
                    await roundMsg.edit({ components: renderChairRows(true, true) }).catch(()=>{});

                    let eliminatedInRound = [];
                    
                    if (!isRoundRed) {
                        for (let player of alivePlayers) {
                            if (roundState[player.id] === undefined) {
                                player.alive = false;
                                eliminatedInRound.push(player);
                            }
                        }
                    } else {
                        for (let playerId of redRoundLosers) {
                            let player = playersMap.get(playerId);
                            if (player && !eliminatedInRound.includes(player)) {
                                eliminatedInRound.push(player);
                            }
                        }
                    }

                    let pingContent = "";
                    let resultDesc = `🏁 انتهت الجولة ${roundNumber}\n`;

                    if (eliminatedInRound.length > 0) {
                        let pings = eliminatedInRound.map(p => `<@${p.id}>`).join(' ');
                        pingContent = `❌ **إقصاء هذا الدور:** ${pings}`;
                        resultDesc += eliminatedInRound.map(p => `• خروج: <@${p.id}>`).join('\n');
                    } else {
                        resultDesc += `• نجا الجميع في هذه الجولة!`;
                    }

                    await message.channel.send({
                        content: pingContent || null,
                        embeds: [new EmbedBuilder().setDescription(resultDesc).setColor(THEME_COLOR)]
                    });

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameActive = false;
                        break;
                    }

                    roundNumber++;
                    await new Promise(res => setTimeout(res, 1500));
                }

                let winner = playersArr.find(p => p.alive);
                if (winner) {
                    let winEmbed = new EmbedBuilder()
                        .setTitle('◆ نهاية لعبة الكراسي')
                        .setDescription(`👑 الناجي الفائز بالمركز الأول:\n<@${winner.id}> ✨`)
                        .setColor(THEME_COLOR);
                    await message.channel.send({ content: `👑 مبارك الفوز بالمركز الأول <@${winner.id}>!`, embeds: [winEmbed] });
                } else {
                    await message.channel.send({ content: `◆ انتهت اللعبة بدون فائز.` });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }

    // ==========================================
    // 3. لعبة ريبيكا (مع التحقق من الفئة والحرف)
    // ==========================================
    if (message.content === prefix + 'ريبيكا' || message.content === prefix + 'rebecca') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const embed = new EmbedBuilder()
            .setTitle('◆ لُعبة ريبيكا (اسم - حيوان - نبات - جماد - بلاد)')
            .setDescription(`انضم إلى التحدي المعرفي!\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('rebecca_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('rebecca_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [embed], components: [row] });
        const collector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'rebecca_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, alive: true });
                }
                await interaction.reply({ content: 'تم انضمامك.', ephemeral: true });
            } else if (interaction.customId === 'rebecca_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(embed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let playersArr = Array.from(playersMap.values());

            if (playersArr.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            try {
                const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];
                let currentLetterIdx = Math.floor(Math.random() * arabicLetters.length);
                let currentLetter = arabicLetters[currentLetterIdx];

                const categories = [
                    { id: 'اسم', name: 'اسم' },
                    { id: 'حيوان', name: 'حيوان' },
                    { id: 'نبات', name: 'نبات' },
                    { id: 'جماد', name: 'جماد' },
                    { id: 'بلاد', name: 'بلاد' }
                ];

                let playerIndex = 0;
                let categoryIndex = 0;
                let gameRunning = true;

                while (gameRunning) {
                    let alivePlayers = playersArr.filter(p => p.alive);
                    if (alivePlayers.length <= 0) break;

                    let currentPlayer = alivePlayers[playerIndex % alivePlayers.length];
                    let currentCategory = categories[categoryIndex];

                    const turnEmbed = new EmbedBuilder()
                        .setTitle('◆ تحدي ريبيكا المتسلسل')
                        .setDescription(`🎯 **الحرف المطلوب:** \`${currentLetter}\`\n📋 **الفئة المطلوبة:** \`${currentCategory.name}\`\n👤 **دور اللاعب:** <@${currentPlayer.id}>\n\n⏳ **اكتب إجابتك في الشات خلال 20 ثانية!**`)
                        .setColor(THEME_COLOR);

                    await message.channel.send({ content: `<@${currentPlayer.id}> دورك! اكتب **${currentCategory.name}** بحرف **${currentLetter}** في الشات:`, embeds: [turnEmbed] });

                    const filter = m => m.author.id === currentPlayer.id;
                    const chatCollector = message.channel.createMessageCollector({ filter, time: 20000, max: 1 });

                    await new Promise((resolve) => {
                        chatCollector.on('collect', async m => {
                            let answerText = m.content.trim();
                            let cleanAnswer = cleanArabic(answerText);
                            let cleanTargetLetter = cleanArabic(currentLetter);

                            let firstChar = cleanAnswer.charAt(0);
                            let isLetterCorrect = (firstChar === cleanTargetLetter);

                            let categoryList = rebeccaDatabase[currentCategory.name] || [];
                            let isCategoryValid = categoryList.some(item => cleanArabic(item) === cleanAnswer);

                            if (isLetterCorrect && isCategoryValid) {
                                await m.react('✅').catch(() => {});
                                await message.channel.send({ content: `✅ إجابة صحيحة وصائبة من <@${currentPlayer.id}>!` });
                            } else {
                                await m.react('❌').catch(() => {});
                                let reason = !isLetterCorrect ? 'الحرف غير مطابق!' : `الكلمة ليست ضمن فئة (${currentCategory.name}) الصحيحة!`;
                                await message.channel.send({ content: `❌ ${reason} تم إقصاء <@${currentPlayer.id}>.` });
                                currentPlayer.alive = false;
                            }
                            resolve();
                        });

                        chatCollector.on('end', collected => {
                            if (collected.size === 0) {
                                message.channel.send({ content: `⏰ انتهى الوقت ولم يرد <@${currentPlayer.id}>! تم إقصاؤه.` });
                                currentPlayer.alive = false;
                                resolve();
                            }
                        });
                    });

                    let remainingAlive = playersArr.filter(p => p.alive);
                    if (remainingAlive.length <= 1) {
                        gameRunning = false;
                        break;
                    }

                    playerIndex++;
                    categoryIndex = (categoryIndex + 1) % categories.length;

                    if (categoryIndex === 0) {
                        currentLetterIdx = (currentLetterIdx + 1) % arabicLetters.length;
                        currentLetter = arabicLetters[currentLetterIdx];
                    }

                    await new Promise(res => setTimeout(res, 1000));
                }

                let finalWinner = playersArr.find(p => p.alive);
                if (finalWinner) {
                    await message.channel.send({ content: `👑 **مبارك الفوز في تحدي ريبيكا:** <@${finalWinner.id}>! 🎉` });
                } else {
                    await message.channel.send({ content: `◆ انتهت اللعبة بدون فائزين.` });
                }

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }

    // ==========================================
    // 4. لعبة تخمين البلد الجغرافي الشاملة (6 جولات عشوائية مع 5 صور + علم لكل دولة)
    // ==========================================
    if (message.content === prefix + 'تخمين' || message.content === prefix + 'guess') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر! انتظر حتى تنتهي.', ephemeral: true });
        }

        activeGames.add(guildId);

        const playersMap = new Map();
        const MAX_PLAYERS = 15;
        const durationSeconds = 15; 
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        const lobbyEmbed = new EmbedBuilder()
            .setTitle('◆ لعبة تخمين البلد الجغرافي الشاملة (6 جولات)')
            .setDescription(`انضم إلى الساحة للمنافسة على أعلى نقاط عبر 6 جولات من دول العالم!\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: `• المُنضمون (0/${MAX_PLAYERS})`, value: '`لا توجد أسماء...`' });

        const joinBtn = new ButtonBuilder().setCustomId('guess_join').setLabel('دخول').setStyle(ButtonStyle.Secondary);
        const leaveBtn = new ButtonBuilder().setCustomId('guess_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn);

        const gameMessage = await message.reply({ embeds: [lobbyEmbed], components: [row] });
        const lobbyCollector = gameMessage.createMessageComponentCollector({ time: durationSeconds * 1000 });

        lobbyCollector.on('collect', async interaction => {
            const userId = interaction.user.id;
            const playerName = interaction.user.displayName || interaction.user.username;

            if (interaction.customId === 'guess_join') {
                if (playersMap.size >= MAX_PLAYERS && !playersMap.has(userId)) {
                    return interaction.reply({ content: 'العدد مكتمل.', ephemeral: true });
                }
                if (!playersMap.has(userId)) {
                    playersMap.set(userId, { id: userId, name: playerName, score: 0 });
                }
                await interaction.reply({ content: 'تم انضمامك بنجاح.', ephemeral: true });
            } else if (interaction.customId === 'guess_leave') {
                if (playersMap.has(userId)) {
                    playersMap.delete(userId);
                    await interaction.reply({ content: 'تم انسحابك.', ephemeral: true });
                } else {
                    return interaction.reply({ content: 'أنت لست منضماً.', ephemeral: true });
                }
            }

            const playersArray = Array.from(playersMap.values());
            const playersList = playersArray.length > 0 
                ? playersArray.map(p => `• ${p.name}`).join('\n') 
                : '`لا توجد أسماء...`';

            const updatedEmbed = EmbedBuilder.from(lobbyEmbed).setFields({ name: `• المُنضمون (${playersMap.size}/${MAX_PLAYERS})`, value: playersList });
            await gameMessage.edit({ embeds: [updatedEmbed] });
        });

        lobbyCollector.on('end', async () => {
            let registeredPlayers = Array.from(playersMap.values());

            if (registeredPlayers.length < 1) {
                activeGames.delete(guildId);
                return gameMessage.edit({ content: '◆ تم إلغاء الجولة لعدم وجود لاعبين كافيين.', embeds: [], components: [] });
            }

            await gameMessage.edit({ content: '🚀 **بدأت لعبة التخمين الجغرافي الشاملة (6 جولات)!**', components: [] }).catch(()=>{});

            // سحب 6 دول عشوائية فريدة من قاعدة البيانات الشاملة لكل جلسة لعب
            let shuffledCountries = [...worldCountriesDatabase].sort(() => 0.5 - Math.random());
            let gameRoundsData = shuffledCountries.slice(0, 6);

            function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                let R = 6371;
                let dLat = (lat2 - lat1) * (Math.PI / 180);
                let dLon = (lon2 - lon1) * (Math.PI / 180);
                let a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            }

            try {
                for (let round = 1; round <= 6; round++) {
                    let countryObj = gameRoundsData[round - 1];
                    // اختيار صورة عشوائية من الـ 5 صور الخاصة بهذه الدولة
                    let randomImage = countryObj.images[Math.floor(Math.random() * countryObj.images.length)];
                    
                    let roundTimeSeconds = 25;
                    let endTimeStamp = Math.floor(Date.now() / 1000) + roundTimeSeconds;

                    const guessEmbed = new EmbedBuilder()
                        .setTitle(`◆ لعبة تخمين البلد الجغرافي (الجولة ${round}/6)`)
                        .setDescription(`تأمل الصورة واكتب اسم **البلد** في الشات.\n💡 تلميح: \`${countryObj.hint}\`\n\n⏳ **ينتهي وقت الجولة خلال:** <t:${endTimeStamp}:R>`)
                        .setThumbnail(countryObj.flag)
                        .setImage(randomImage)
                        .setColor(THEME_COLOR);

                    let roundMsg = await message.channel.send({ embeds: [guessEmbed] });

                    // تخزين الإجابات الصحيحة مع وقت الإجابة
                    let correctAnswers = [];
                    let answerTimestamps = new Map();

                    let filter = m => playersMap.has(m.author.id) && !m.author.bot;
                    let chatCollector = message.channel.createMessageCollector({ filter, time: roundTimeSeconds * 1000 });

                    chatCollector.on('collect', m => {
                        let userAns = cleanArabic(m.content);
                        let isCorrect = (cleanArabic(countryObj.name) === userAns);
                        
                        if (isCorrect && !answerTimestamps.has(m.author.id)) {
                            answerTimestamps.set(m.author.id, Date.now());
                            correctAnswers.push({ userId: m.author.id, timestamp: Date.now() });
                            m.react('✅').catch(() => {});
                        }
                    });

                    await new Promise(resolve => {
                        chatCollector.on('end', () => resolve());
                    });

                    correctAnswers.sort((a, b) => a.timestamp - b.timestamp);

                    let roundSummary = `🏁 **نتائج الجولة ${round} من 6**\nالبلد الصحيح: **${countryObj.name}**\n\n`;
                    
                    if (correctAnswers.length === 0) {
                        roundSummary += '`لم يقم أي من المشاركين بتخمين البلد بشكل صحيح في هذه الجولة!`';
                    } else {
                        const rewardPoints = [50, 40, 30, 20, 10];
                        correctAnswers.forEach((item, index) => {
                            let points = (index < rewardPoints.length) ? rewardPoints[index] : 5;
                            let pObj = playersMap.get(item.userId);
                            if (pObj) pObj.score += points;
                            roundSummary += `• <@${item.userId}> - إجابة صحيحة ➔ **+${points} نقطة**\n`;
                        });
                    }

                    const roundEmbed = new EmbedBuilder()
                        .setTitle(`◆ حصيلة الجولة ${round}`)
                        .setDescription(roundSummary)
                        .setColor(THEME_COLOR);

                    await message.channel.send({ embeds: [roundEmbed] });
                    await new Promise(res => setTimeout(res, 3000));
                }

                // نهاية الـ 6 جولات واعلان الترتيب النهائي
                let finalPlayersArr = Array.from(playersMap.values());
                finalPlayersArr.sort((a, b) => b.score - a.score);

                let finalDesc = `🏆 **انتهت الـ 6 جولات بنجاح! إليكم الترتيب النهائي والمجموع الكلي للنقاط:**\n\n`;
                finalPlayersArr.forEach((p, idx) => {
                    let medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🔹';
                    finalDesc += `${medal} **${p.name}**: \`${p.score} نقطة\`\n`;
                });

                let winner = finalPlayersArr[0];
                if (winner && winner.score > 0) {
                    finalDesc += `\n🎉 **الفائز بالمركز الأول بجدارة هو <@${winner.id}> برصيد ${winner.score} نقطة!**`;
                } else {
                    finalDesc += `\n◆ انتهت اللعبة بدون جمع نقاط كافية.`;
                }

                const finalEmbed = new EmbedBuilder()
                    .setTitle('◆ لوحة الشرف النهائية - تخمين البلد')
                    .setDescription(finalDesc)
                    .setColor(THEME_COLOR);

                await message.channel.send({ embeds: [finalEmbed] });

            } catch (error) {
                console.error(error);
            } finally {
                activeGames.delete(guildId);
            }
        });
    }
});

client.login(process.env.TOKEN);
