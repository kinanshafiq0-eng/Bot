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

const THEME_COLOR = '#0A0A0A'; // أسود داكن فخم
const activeGames = new Set();

// ==========================================
// قاعدة بيانات فئات ريبيكا للتحقق من صحة الكلمات
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
// قاعدة بيانات دول العالم (مع الإحداثيات و 5 صور)
// ==========================================
const worldCountriesDatabase = [
    { name: 'الاردن', lat: 31.95, lon: 35.91, hint: 'بلد عربي يشتهر بمدينة البتراء الأثرية', images: [
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'فلسطين', lat: 31.90, lon: 35.20, hint: 'مهد الديانات وعاصمة التاريخ والصمود', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'مصر', lat: 30.04, lon: 31.23, hint: 'بلد الأهرامات ونهر النيل الخالد', images: [
        'https://images.unsplash.com/photo-1539785876258-0043141e05a3?w=800', 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', 'https://images.unsplash.com/photo-1568322445167-e9aef09a9638?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800'
    ]},
    { name: 'السعودية', lat: 24.71, lon: 46.67, hint: 'قلب العالم الإسلامي وبلاد الحرمين الشريفين', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'الإمارات', lat: 24.45, lon: 54.37, hint: 'تضم أطول برج في العالم وواحة ناطحات السحاب', images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1526495124233-a0af41858376?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'فرنسا', lat: 48.85, lon: 2.35, hint: 'عاصمة الموضة وبرج إيفل الشهير', images: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1509439573887-01e76b4d2c0b?w=800', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800'
    ]},
    { name: 'بريطانيا', lat: 51.50, lon: -0.12, hint: 'بلد الساعة الكبرى بيج بن ونهر التمز', images: [
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800', 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800', 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800'
    ]},
    { name: 'اليابان', lat: 35.67, lon: 139.65, hint: 'بلاد الساموراي وأزهار الساكورا والتكنولوجيا', images: [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'تركيا', lat: 41.00, lon: 28.97, hint: 'ملتقى القارات ومعالم إسطنبول العريقة', images: [
        'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', 'https://images.unsplash.com/photo-1527838832700-505925257cb7?w=800', 'https://images.unsplash.com/photo-1569383749723-942ad26fc546?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'
    ]},
    { name: 'ايطاليا', lat: 41.90, lon: 12.49, hint: 'بلد الكولوسيوم والبيتزا والتاريخ الروماني', images: [
        'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
    ]},
    { name: 'المانيا', lat: 52.52, lon: 13.40, hint: 'عاصمة الصناعة وقوة أوروبا الاقتصادية', images: [
        'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800'
    ]},
    { name: 'اسبانيا', lat: 40.41, lon: -3.70, hint: 'بلد الشمس والشواطئ ومعالم مدريد وبرشلونة', images: [
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800', 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', 'https://images.unsplash.com/photo-1511527661048-7fa73d8af18g?w=800'
    ]},
    { name: 'امريكا', lat: 38.89, lon: -77.03, hint: 'بلاد العم سام وتمثال الحرية وناطحات السحاب الكبرى', images: [
        'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800', 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800'
    ]},
    { name: 'كندا', lat: 45.42, lon: -75.69, hint: 'بلد الطبيعة الخلابة وأوراق الشجر القيقبية', images: [
        'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800', 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800', 'https://images.unsplash.com/photo-1508193638397-1c42f9db1780?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'البرازيل', lat: -15.79, lon: -47.88, hint: 'موطن كرة القدم وغابات الأمازون وراميو السامبا', images: [
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800', 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800', 'https://images.unsplash.com/photo-1508873696983-2df5c920aac9?w=800'
    ]},
    { name: 'الصين', lat: 39.90, lon: 116.40, hint: 'بلد سور الصين العظيم والتاريخ الآقي العريق', images: [
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=800', 'https://images.unsplash.com/photo-1578469550956-15cc9d5df96c?w=800', 'https://images.unsplash.com/photo-1599839575945-a9e9afbc135d?w=800', 'https://images.unsplash.com/photo-1528164344705-475426879c0d?w=800'
    ]},
    { name: 'الهند', lat: 28.61, lon: 77.20, hint: 'بلد تاج محل والثقافات المتنوعة والألوان الزاهية', images: [
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 'https://images.unsplash.com/photo-1522885147699-6faa2093530d?w=800', 'https://images.unsplash.com/photo-1592635199204-a953c6d66e74?w=800'
    ]},
    { name: 'كوريا الجنوبية', lat: 37.56, lon: 126.97, hint: 'بلد الثقافة الحديثة وقصور سيول والتكنولوجيا', images: [
        'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1548113251-f5e71d36d49f?w=800'
    ]},
    { name: 'الأرجنتين', lat: -34.60, lon: -58.38, hint: 'موطن التانجو ونجوم كرة القدم في أمريكا الجنوبية', images: [
        'https://images.unsplash.com/photo-1589909202874-1789fd59f0d2?w=800', 'https://images.unsplash.com/photo-1612294037637-ec32080dcfb4?w=800', 'https://images.unsplash.com/photo-1531816433857-463287d3a8a9?w=800', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800', 'https://images.unsplash.com/photo-1533929736458-ca588d58c8be?w=800'
    ]},
    { name: 'المكسيك', lat: 19.43, lon: -99.13, hint: 'بلد الحضارات القديمة والأهرامات الأمريكية والمأكولات الشهيرة', images: [
        'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800', 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?w=800'
    ]},
    { name: 'إندونيسيا', lat: -6.20, lon: 106.84, hint: 'أكبر دولة إسلامية من حيث السكان وتضم جزر بالي الساحرة', images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800', 'https://images.unsplash.com/photo-1555899467-f0c3dab653a9?w=800', 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800', 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800'
    ]},
    { name: 'هندوراس', lat: 14.07, lon: -87.20, hint: 'بلد في أمريكا الوسطى يشتهر بآثار المايا والشواطئ الكрибية', images: [
        'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1512818016086-13d46cb342c8?w=800', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800'
    ]},
    { name: 'كوريا الشمالية', lat: 39.03, lon: 125.75, hint: 'دولة ذات طبيعة جبلية صارمة وعاصمة بيونغ يانغ', images: [
        'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800', 'https://images.unsplash.com/photo-1538485399060-0714fc2874fa?w=800', 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=800', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800'
    ]},
    { name: 'السويد', lat: 59.32, lon: 18.06, hint: 'بلد إسكندنافي يشتهر بالغابات والبحيرات وتصميم الطبيعة الخلابة', images: [
        'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1527788313554-dcd17b732442?w=800', 'https://images.unsplash.com/photo-1509356843159-d6e4a89ef5ab?w=800', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800'
    ]},
    { name: 'نرويج', lat: 59.91, lon: 10.75, hint: 'بلد المضايق البحرية العميقة والأضواء الشمالية الشفق البقطبي', images: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800', 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'
    ]},
    { name: 'الجزائر', lat: 36.75, lon: 3.05, hint: 'بلد المليون شهور وأكبر دولة عربية مساحة مع معالم الصحراء الكبرى', images: [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800', 'https://images.unsplash.com/photo-1569263979104-865ab9cd8d49?w=800', 'https://images.unsplash.com/photo-1578334465494-04664c12574e?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800'
    ]},
    { name: 'المغرب', lat: 33.97, lon: -6.84, hint: 'بلد الألوان والأسواق التاريخية وجبال الأطلس وعاصمة الرباط', images: [
        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800', 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'
    ]},
    { name: 'تونس', lat: 36.80, lon: 10.18, hint: 'بلد الآثار القرطاجية والشواطئ المتوسطية الساحرة', images: [
        'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', 'https://images.unsplash.com/photo-1527838832700-505925257cb7?w=800', 'https://images.unsplash.com/photo-1569383749723-942ad26fc546?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800'
    ]},
    { name: 'العراق', lat: 33.31, lon: 44.36, hint: 'بلد بلاد ما بين النهرين والتاريخ الحضاري العريق وبابل', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'سوريا', lat: 33.51, lon: 36.29, hint: 'بلد الياسمين ودمشق العاصمة الأقدم في التاريخ', images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'لبنان', lat: 33.89, lon: 35.50, hint: 'بلد الأرز وطبيعة بيروت الساحرة ومعالمها العريقة', images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800', 'https://images.unsplash.com/photo-1568194053315-89f5ce127494?w=800', 'https://images.unsplash.com/photo-1650645604112-9c107297e163?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800'
    ]},
    { name: 'الكويت', lat: 29.37, lon: 47.97, hint: 'دولة الخليج العربي وتشتهر بأبراج الكويت الشهيرة', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800'
    ]},
    { name: 'قطر', lat: 25.28, lon: 51.53, hint: 'بلد اللؤلؤ ونهضة الدوحة الحديثة واستضافة المونديال', images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1526495124233-a0af41858376?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'البحرين', lat: 26.06, lon: 50.55, hint: 'لؤلؤة الخليج وجزر الدار والتاريخ العريق', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800', 'https://images.unsplash.com/photo-1576014131356-fc844ff73ab9?w=800'
    ]},
    { name: 'عمان', lat: 23.58, lon: 58.38, hint: 'سلطنة الجبال والشواطئ النظيفة والقلاع التاريخية', images: [
        'https://images.unsplash.com/photo-1586724237569-f3d025d76a0a?w=800', 'https://images.unsplash.com/photo-1578895101408-1a3640d7873c?w=800', 'https://images.unsplash.com/photo-1565013067884-25d98306f2e8?w=800', 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800'
    ]},
    { name: 'اليونان', lat: 37.98, lon: 23.72, hint: 'مهد الحضارة الغربية والجزر البيضاء الساحرة في البحر المتوسط', images: [
        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800', 'https://images.unsplash.com/photo-1503152394-c571994fd138?w=800'
    ]},
    { name: 'هولندا', lat: 52.36, lon: 4.90, hint: 'بلد طواحين الهواء وقنوات أمستردام المائية وأحقول الزهور', images: [
        'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800', 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800', 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800'
    ]},
    { name: 'سويسرا', lat: 46.94, lon: 7.44, hint: 'بلد الجبال السويسرية الشجعاء والشوكولاتة الفاخرة والساعات العريقة', images: [
        'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800', 'https://images.unsplash.com/photo-1527668752066-b4a2fc01e61f?w=800', 'https://images.unsplash.com/photo-1502101872923-d48509bff386?w=800', 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?w=800', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
    ]},
    { name: 'البرتغال', lat: 38.72, lon: -9.13, hint: 'بلد المستكشفين والشواطئ الأطلسية الساحرة في شبه الجزيرة الإيبيرية', images: [
        'https://images.unsplash.com/photo-1513581166391-8f6a97fc92a2?w=800', 'https://images.unsplash.com/photo-1548711645-2a26569a6c98?w=800', 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', 'https://images.unsplash.com/photo-1508233324673-f932859d040a?w=800'
    ]},
    { name: 'بلجيكا', lat: 50.85, lon: 4.35, hint: 'عاصمة الاتحاد الأوروبي وتشتهر بالشوكولاتة البلجيكية والمهندسة المعمارية', images: [
        'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800', 'https://images.unsplash.com/photo-1546874177-9e664107bc48?w=800'
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
                    .setDescription(`اختر صندوقاً من الـ 25 لتختبئ فيه.\n⏳ **الوقت:** 12 ثانية`)
                    .setColor(THEME_COLOR);

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
                            let randomBox;
                            do {
                                randomBox = Math.floor(Math.random() * 25) + 1;
                            } while (playersArr.some(p => p.hidingSpot === randomBox));
                            player.hidingSpot = randomBox;
                        }
                    }

                    let boxStatusMap = {};
                    let currentEmbed = new EmbedBuilder()
                        .setTitle('◇ جولة التدمير العشوائي')
                        .setDescription('يبدأ البوت بتفجير الصناديق عشوائياً واحد تلو الآخر!')
                        .setColor(THEME_COLOR);

                    await hideMsg.edit({ embeds: [currentEmbed], components: renderBoxesRows(true, boxStatusMap) });

                    let alivePlayers = [...playersArr];

                    const explodeInterval = setInterval(async () => {
                        let availableBoxes = [];
                        for (let b = 1; b <= 25; b++) {
                            if (!Object.keys(boxStatusMap).includes(b.toString())) {
                                availableBoxes.push(b);
                            }
                        }

                        if (availableBoxes.length === 0 || alivePlayers.length <= 1) {
                            clearInterval(explodeInterval);
                            finishHideGame();
                            return;
                        }

                        let randomIdx = Math.floor(Math.random() * availableBoxes.length);
                        let blownBox = availableBoxes[randomIdx];

                        let victims = alivePlayers.filter(p => p.hidingSpot === blownBox);
                        if (victims.length > 0) {
                            boxStatusMap[blownBox] = 'hit'; // تم تفجير صندوق فيه لاعب
                            for (let v of victims) {
                                v.alive = false;
                            }
                            alivePlayers = alivePlayers.filter(p => p.alive);
                        } else {
                            boxStatusMap[blownBox] = 'safe'; // صندوق فارغ
                        }

                        let statusDesc = alivePlayers.length > 0 
                            ? `💥 تم تفجير الصندوق **[${blownBox}]**!\n👥 المتبقون: ${alivePlayers.map(p => p.name).join(', ')}`
                            : `💥 تم تفجير الصندوق **[${blownBox}]**!`;

                        currentEmbed.setDescription(statusDesc);
                        await hideMsg.edit({ embeds: [currentEmbed], components: renderBoxesRows(true, boxStatusMap) });

                        if (alivePlayers.length <= 1) {
                            clearInterval(explodeInterval);
                            setTimeout(finishHideGame, 2000);
                        }
                    }, 2500);

                    async function finishHideGame() {
                        activeGames.delete(guildId);
                        let winnerText = alivePlayers.length === 1 
                            ? `👑 الفائز في لعبة الاختباء هو: **${alivePlayers[0].name}**!` 
                            : '🤝 انتهت اللعبة بتعادل جماعي!';

                        let endEmbed = new EmbedBuilder()
                            .setTitle('◆ نهاية لعبة الاختباء')
                            .setDescription(winnerText)
                            .setColor(THEME_COLOR);

                        await message.channel.send({ embeds: [endEmbed] });
                    }
                });

            } catch (err) {
                activeGames.delete(guildId);
                console.error(err);
            }
        });
    }

    // ==========================================
    // 2. لعبة الكراسي الموسيقية
    // ==========================================
    if (message.content === prefix + 'كراسي' || message.content === prefix + 'chairs') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر!', ephemeral: true });
        }

        activeGames.add(guildId);

        let playersMap = new Map();
        const durationSeconds = 15;
        const endTime = Math.floor(Date.now() / 1000) + durationSeconds;

        let embed = new EmbedBuilder()
            .setTitle('◆ الكراسي الموسيقية')
            .setDescription(`اضغط على الزر أدناه للانضمام إلى اللعبة.\n\n⏳ **تبدأ اللعبة تلقائياً خلال:** <t:${endTime}:R>`)
            .setColor(THEME_COLOR)
            .addFields({ name: '• المشاركون (0)', value: '`لا توجد أسماء...`' });

        let joinBtn = new ButtonBuilder().setCustomId('chairs_join').setLabel('جلس').setStyle(ButtonStyle.Secondary);
        let row = new ActionRowBuilder().addComponents(joinBtn);

        let gameMsg = await message.reply({ embeds: [embed], components: [row] });
        let collector = gameMsg.createMessageComponentCollector({ time: durationSeconds * 1000 });

        collector.on('collect', async i => {
            let uid = i.user.id;
            let name = i.user.displayName || i.user.username;
            if (!playersMap.has(uid)) {
                playersMap.set(uid, name);
                await i.reply({ content: 'جلست على الكرسي بنظرة ترقب!', ephemeral: true });
            } else {
                await i.reply({ content: 'أنت جالس بالفعل.', ephemeral: true });
            }

            let namesArr = Array.from(playersMap.values());
            let updatedEmbed = EmbedBuilder.from(embed)
                .setFields({ name: `• المشاركون (${namesArr.length})`, value: namesArr.join(', ') || '`لا توجد أسماء...`' });
            await gameMsg.edit({ embeds: [updatedEmbed] });
        });

        collector.on('end', async () => {
            let players = Array.from(playersMap.values());
            if (players.length === 0) {
                activeGames.delete(guildId);
                return gameMsg.edit({ content: '◆ تم إلغاء لعبة الكراسي لعدم وجود مشاركين.', embeds: [], components: [] });
            }

            let winner = players[Math.floor(Math.random() * players.length)];
            activeGames.delete(guildId);

            let winEmbed = new EmbedBuilder()
                .setTitle('◆ نهاية الكراسي الموسيقية')
                .setDescription(`🎵 توقفت الموسيقى فجأة!\n👑 الفائز الذي خطف الكرسي الأخير هو: **${winner}**!`)
                .setColor(THEME_COLOR);

            await message.channel.send({ embeds: [winEmbed] });
        });
    }

    // ==========================================
    // 3. لعبة ريبيكا (إنسان، حيوان، نبات، جماد، بلاد)
    // ==========================================
    if (message.content === prefix + 'ريبيكا' || message.content === prefix + 'rebecca') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر!', ephemeral: true });
        }

        activeGames.add(guildId);

        const categories = ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomLetters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
        const randomLetter = randomLetters[Math.floor(Math.random() * randomLetters.length)];

        let rebeccaEmbed = new EmbedBuilder()
            .setTitle('◆ لعبة ريبيكا السريعة')
            .setDescription(`الفئة المطلوبة: **${randomCategory}**\nالحرف الحائز: **${randomLetter}**\n\n⏳ أسرع واكتب كلمة صحيحة تبدأ بهذا الحرف في الشات خلال **15 ثانية**!`)
            .setColor(THEME_COLOR);

        await message.channel.send({ embeds: [rebeccaEmbed] });

        let filter = m => !m.author.bot;
        let collector = message.channel.createMessageCollector({ filter, time: 15000 });
        let winnerFound = false;

        collector.on('collect', m => {
            if (winnerFound) return;
            let contentClean = cleanArabic(m.content);
            let targetLetterClean = cleanArabic(randomLetter);

            if (contentClean.startsWith(targetLetterClean)) {
                let dbList = rebeccaDatabase[randomCategory] || [];
                let isExist = dbList.some(word => cleanArabic(word) === contentClean);

                if (isExist) {
                    winnerFound = true;
                    let winnerName = m.author.displayName || m.author.username;
                    collector.stop();
                    activeGames.delete(guildId);

                    let winEmbed = new EmbedBuilder()
                        .setTitle('◆ فائز جديد في ريبيكا')
                        .setDescription(`🎉 الكفو **${winnerName}** أجاوب بالإجابة الصحيحة (**${m.content}**) وفاز بالجولة!`)
                        .setColor(THEME_COLOR);

                    m.reply({ embeds: [winEmbed] });
                }
            }
        });

        collector.on('end', () => {
            if (!winnerFound) {
                activeGames.delete(guildId);
                message.channel.send({ content: `⏰ انتهى الوقت ولم يكتب أحد إجابة صحيحة تبدأ بحرف **${randomLetter}** لقسم **${randomCategory}**.` });
            }
        });
    }

    // ==========================================
    // 4. لعبة تخمين الدولة (مع الصور والإحداثيات)
    // ==========================================
    if (message.content === prefix + 'تخمين' || message.content === prefix + 'guess') {
        if (activeGames.has(guildId)) {
            return message.reply({ content: '⚠️ توجد لعبة أخرى تعمل حالياً في السيرفر!', ephemeral: true });
        }

        activeGames.add(guildId);

        let country = worldCountriesDatabase[Math.floor(Math.random() * worldCountriesDatabase.length)];
        let randomImg = country.images[Math.floor(Math.random() * country.images.length)];

        let guessEmbed = new EmbedBuilder()
            .setTitle('◆ لعبة تخمين دول العالم')
            .setDescription(`🌍 **تلميح:** ${country.hint}\n🗺️ **الإحداثيات:** [Lat: ${country.lat}, Lon: ${country.lon}]\n\n⏳ أمامكم **20 ثانية** لتخمين اسم الدولة واكتشافها!`)
            .setImage(randomImg)
            .setColor(THEME_COLOR);

        await message.channel.send({ embeds: [guessEmbed] });

        let filter = m => !m.author.bot;
        let collector = message.channel.createMessageCollector({ filter, time: 20000 });
        let guessedCorrectly = false;

        collector.on('collect', m => {
            if (guessedCorrectly) return;
            let userGuess = cleanArabic(m.content);
            let correctName = cleanArabic(country.name);

            if (userGuess.includes(correctName) || correctName.includes(userGuess)) {
                guessedCorrectly = true;
                collector.stop();
                activeGames.delete(guildId);

                let winnerName = m.author.displayName || m.author.username;
                let correctEmbed = new EmbedBuilder()
                    .setTitle('◆ إجابة صحيحة!')
                    .setDescription(`🏆 البطل **${winnerName}** استطاع تخمين الدولة الصحيحة وهي: **${country.name}**!`)
                    .setColor(THEME_COLOR);

                m.reply({ embeds: [correctEmbed] });
            }
        });

        collector.on('end', () => {
            if (!guessedCorrectly) {
                activeGames.delete(guildId);
                message.channel.send({ content: `⏰ انتهى الوقت! الدولة الصحيحة التي كان يجب تخمينها هي: **${country.name}**.` });
            }
        });
    }
});

client.login(process.env.TOKEN);
