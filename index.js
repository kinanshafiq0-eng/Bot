// index.js
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType,
    AttachmentBuilder
} = require('discord.js');

// استيراد node-fetch (تأكد من تثبيته: npm install node-fetch@2)
const fetch = require('node-fetch');

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
// قاعدة بيانات فئات ريبيكا
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
// قاعدة بيانات الدول مع صور من ويكيبيديا (معالم مشهورة)
// ==========================================
const countryData = [
    { name: 'الاردن', lat: 31.95, lon: 35.91, hint: 'بلد عربي يشتهر بمدينة البتراء الأثرية', flag: 'https://flagcdn.com/jo.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Al-Khazneh_%28Petra%29.jpg/800px-Al-Khazneh_%28Petra%29.jpg' },
    { name: 'فلسطين', lat: 31.90, lon: 35.20, hint: 'مهد الديانات وعاصمة التاريخ والصمود', flag: 'https://flagcdn.com/ps.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Dome_of_the_Rock_%282015%29.jpg/800px-Dome_of_the_Rock_%282015%29.jpg' },
    { name: 'مصر', lat: 30.04, lon: 31.23, hint: 'بلد الأهرامات ونهر النيل الخالد', flag: 'https://flagcdn.com/eg.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Great_Pyramid_of_Giza_%28Gizeh%29.jpg/800px-Great_Pyramid_of_Giza_%28Gizeh%29.jpg' },
    { name: 'السعودية', lat: 24.71, lon: 46.67, hint: 'قلب العالم الإسلامي وبلاد الحرمين الشريفين', flag: 'https://flagcdn.com/sa.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kaaba_%28Mecca%29.jpg/800px-Kaaba_%28Mecca%29.jpg' },
    { name: 'الإمارات', lat: 24.45, lon: 54.37, hint: 'تضم أطول برج في العالم وواحة ناطحات السحاب', flag: 'https://flagcdn.com/ae.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Burj_Khalifa.jpg/800px-Burj_Khalifa.jpg' },
    { name: 'فرنسا', lat: 48.85, lon: 2.35, hint: 'عاصمة الموضة وبرج إيفل الشهير', flag: 'https://flagcdn.com/fr.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg' },
    { name: 'بريطانيا', lat: 51.50, lon: -0.12, hint: 'بلد الساعة الكبرى بيج بن ونهر التمز', flag: 'https://flagcdn.com/gb.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Big_Ben_%282014%29.jpg/800px-Big_Ben_%282014%29.jpg' },
    { name: 'اليابان', lat: 35.67, lon: 139.65, hint: 'بلاد الساموراي وأزهار الساكورا والتكنولوجيا', flag: 'https://flagcdn.com/jp.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Mount_Fuji_%28Japan%29.jpg/800px-Mount_Fuji_%28Japan%29.jpg' },
    { name: 'تركيا', lat: 41.00, lon: 28.97, hint: 'ملتقى القارات ومعالم إسطنبول العريقة', flag: 'https://flagcdn.com/tr.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Hagia_Sophia_%28Istanbul%29.jpg/800px-Hagia_Sophia_%28Istanbul%29.jpg' },
    { name: 'ايطاليا', lat: 41.90, lon: 12.49, hint: 'بلد الكولوسيوم والبيتزا والتاريخ الروماني', flag: 'https://flagcdn.com/it.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseum_%28Rome%29.jpg/800px-Colosseum_%28Rome%29.jpg' },
    { name: 'المانيا', lat: 52.52, lon: 13.40, hint: 'عاصمة الصناعة وقوة أوروبا الاقتصادية', flag: 'https://flagcdn.com/de.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Brandenburger_Tor_%28Berlin%29.jpg/800px-Brandenburger_Tor_%28Berlin%29.jpg' },
    { name: 'اسبانيا', lat: 40.41, lon: -3.70, hint: 'بلد الشمس والشواطئ ومعالم مدريد وبرشلونة', flag: 'https://flagcdn.com/es.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Sagrada_Familia_%28Barcelona%29.jpg/800px-Sagrada_Familia_%28Barcelona%29.jpg' },
    { name: 'امريكا', lat: 38.89, lon: -77.03, hint: 'بلاد العم سام وتمثال الحرية وناطحات السحاب الكبرى', flag: 'https://flagcdn.com/us.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_%28New_York%29.jpg/800px-Statue_of_Liberty_%28New_York%29.jpg' },
    { name: 'كندا', lat: 45.42, lon: -75.69, hint: 'بلد الطبيعة الخلابة وأوراق الشجر القيقبية', flag: 'https://flagcdn.com/ca.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Moraine_Lake_%28Canada%29.jpg/800px-Moraine_Lake_%28Canada%29.jpg' },
    { name: 'البرازيل', lat: -15.79, lon: -47.88, hint: 'موطن كرة القدم وغابات الأمازون وراميو السامبا', flag: 'https://flagcdn.com/br.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Christ_the_Redeemer_%28Rio%29.jpg/800px-Christ_the_Redeemer_%28Rio%29.jpg' },
    { name: 'الصين', lat: 39.90, lon: 116.40, hint: 'بلد سور الصين العظيم والتاريخ العريق', flag: 'https://flagcdn.com/cn.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Great_Wall_of_China_%28Mutianyu%29.jpg/800px-Great_Wall_of_China_%28Mutianyu%29.jpg' },
    { name: 'الهند', lat: 28.61, lon: 77.20, hint: 'بلد تاج محل والثقافات المتنوعة والألوان الزاهية', flag: 'https://flagcdn.com/in.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Taj_Mahal_%28Agra%29.jpg/800px-Taj_Mahal_%28Agra%29.jpg' },
    { name: 'كوريا الجنوبية', lat: 37.56, lon: 126.97, hint: 'بلد الثقافة الحديثة وقصور سيول والتكنولوجيا', flag: 'https://flagcdn.com/kr.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Gyeongbokgung_%28Seoul%29.jpg/800px-Gyeongbokgung_%28Seoul%29.jpg' },
    { name: 'الأرجنتين', lat: -34.60, lon: -58.38, hint: 'موطن التانجو ونجوم كرة القدم في أمريكا الجنوبية', flag: 'https://flagcdn.com/ar.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Casa_Rosada_%28Buenos_Aires%29.jpg/800px-Casa_Rosada_%28Buenos_Aires%29.jpg' },
    { name: 'المكسيك', lat: 19.43, lon: -99.13, hint: 'بلد الحضارات القديمة والأهرامات والمأكولات الشهيرة', flag: 'https://flagcdn.com/mx.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Chichen_Itza_%28Mexico%29.jpg/800px-Chichen_Itza_%28Mexico%29.jpg' },
    { name: 'إندونيسيا', lat: -6.20, lon: 106.84, hint: 'أكبر دولة إسلامية من حيث السكان وتضم جزر بالي الساحرة', flag: 'https://flagcdn.com/id.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Borobudur_%28Java%29.jpg/800px-Borobudur_%28Java%29.jpg' },
    { name: 'هندوراس', lat: 14.07, lon: -87.20, hint: 'بلد في أمريكا الوسطى يشتهر بآثار المايا والشواطئ الكاريبية', flag: 'https://flagcdn.com/hn.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Copan_%28Honduras%29.jpg/800px-Copan_%28Honduras%29.jpg' },
    { name: 'كوريا الشمالية', lat: 39.03, lon: 125.75, hint: 'دولة ذات طبيعة جبلية صارمة وعاصمة بيونغ يانغ', flag: 'https://flagcdn.com/kp.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Pyongyang_%28North_Korea%29.jpg/800px-Pyongyang_%28North_Korea%29.jpg' },
    { name: 'السويد', lat: 59.32, lon: 18.06, hint: 'بلد إسكندنافي يشتهر بالغابات والبحيرات وتصميم الطبيعة الخلابة', flag: 'https://flagcdn.com/se.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Stockholm_%28Sweden%29.jpg/800px-Stockholm_%28Sweden%29.jpg' },
    { name: 'نرويج', lat: 59.91, lon: 10.75, hint: 'بلد المضايق البحرية العميقة والأضواء الشمالية الشفق القطبي', flag: 'https://flagcdn.com/no.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Geirangerfjord_%28Norway%29.jpg/800px-Geirangerfjord_%28Norway%29.jpg' },
    { name: 'الجزائر', lat: 36.75, lon: 3.05, hint: 'بلد المليون شهيد وأكبر دولة عربية مساحة مع الصحراء الكبرى', flag: 'https://flagcdn.com/dz.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Algiers_%28Algeria%29.jpg/800px-Algiers_%28Algeria%29.jpg' },
    { name: 'المغرب', lat: 33.97, lon: -6.84, hint: 'بلد الألوان والأسواق التاريخية وجبال الأطلس وعاصمة الرباط', flag: 'https://flagcdn.com/ma.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Marrakech_%28Morocco%29.jpg/800px-Marrakech_%28Morocco%29.jpg' },
    { name: 'تونس', lat: 36.80, lon: 10.18, hint: 'بلد الآثار القرطاجية والشواطئ المتوسطية الساحرة', flag: 'https://flagcdn.com/tn.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Tunis_%28Tunisia%29.jpg/800px-Tunis_%28Tunisia%29.jpg' },
    { name: 'العراق', lat: 33.31, lon: 44.36, hint: 'بلد بلاد ما بين النهرين والتاريخ الحضاري العريق وبابل', flag: 'https://flagcdn.com/iq.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Babylon_%28Iraq%29.jpg/800px-Babylon_%28Iraq%29.jpg' },
    { name: 'سوريا', lat: 33.51, lon: 36.29, hint: 'بلد الياسمين ودمشق العاصمة الأقدم في التاريخ', flag: 'https://flagcdn.com/sy.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Damascus_%28Syria%29.jpg/800px-Damascus_%28Syria%29.jpg' },
    { name: 'لبنان', lat: 33.89, lon: 35.50, hint: 'بلد الأرز وطبيعة بيروت الساحرة ومعالمها العريقة', flag: 'https://flagcdn.com/lb.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Beirut_%28Lebanon%29.jpg/800px-Beirut_%28Lebanon%29.jpg' },
    { name: 'الكويت', lat: 29.37, lon: 47.97, hint: 'دولة الخليج العربي وتشتهر بأبراج الكويت الشهيرة', flag: 'https://flagcdn.com/kw.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kuwait_City_%28Kuwait%29.jpg/800px-Kuwait_City_%28Kuwait%29.jpg' },
    { name: 'قطر', lat: 25.28, lon: 51.53, hint: 'بلد اللؤلؤ ونهضة الدوحة الحديثة واستضافة المونديال', flag: 'https://flagcdn.com/qa.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Doha_%28Qatar%29.jpg/800px-Doha_%28Qatar%29.jpg' },
    { name: 'البحرين', lat: 26.06, lon: 50.55, hint: 'لؤلؤة الخليج وجزر الدار والتاريخ العريق', flag: 'https://flagcdn.com/bh.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Manama_%28Bahrain%29.jpg/800px-Manama_%28Bahrain%29.jpg' },
    { name: 'عمان', lat: 23.58, lon: 58.38, hint: 'سلطنة الجبال والشواطئ النظيفة والقلاع التاريخية', flag: 'https://flagcdn.com/om.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Muscat_%28Oman%29.jpg/800px-Muscat_%28Oman%29.jpg' },
    { name: 'اليونان', lat: 37.98, lon: 23.72, hint: 'مهد الحضارة الغربية والجزر البيضاء الساحرة في البحر المتوسط', flag: 'https://flagcdn.com/gr.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Parthenon_%28Athens%29.jpg/800px-Parthenon_%28Athens%29.jpg' },
    { name: 'هولندا', lat: 52.36, lon: 4.90, hint: 'بلد طواحين الهواء وقنوات أمستردام المائية وحقول الزهور', flag: 'https://flagcdn.com/nl.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Amsterdam_%28Netherlands%29.jpg/800px-Amsterdam_%28Netherlands%29.jpg' },
    { name: 'سويسرا', lat: 46.94, lon: 7.44, hint: 'بلد الجبال السويسرية الشهيرة والشوكولاتة الفاخرة والساعات العريقة', flag: 'https://flagcdn.com/ch.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Matterhorn_%28Switzerland%29.jpg/800px-Matterhorn_%28Switzerland%29.jpg' },
    { name: 'البرتغال', lat: 38.72, lon: -9.13, hint: 'بلد المستكشفين والشواطئ الأطلسية الساحرة', flag: 'https://flagcdn.com/pt.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Lisbon_%28Portugal%29.jpg/800px-Lisbon_%28Portugal%29.jpg' },
    { name: 'بلجيكا', lat: 50.85, lon: 4.35, hint: 'عاصمة الاتحاد الأوروبي وتشتهر بالشوكولاتة البلجيكية', flag: 'https://flagcdn.com/be.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Brussels_%28Belgium%29.jpg/800px-Brussels_%28Belgium%29.jpg' },
    { name: 'روسيا', lat: 55.75, lon: 37.62, hint: 'أكبر دولة في العالم مساحةً وعاصمة موسكو', flag: 'https://flagcdn.com/ru.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/St._Basil%27s_Cathedral_%28Moscow%29.jpg/800px-St._Basil%27s_Cathedral_%28Moscow%29.jpg' },
    { name: 'أوكرانيا', lat: 50.45, lon: 30.52, hint: 'بلد السهول الخضراء وعاصمتها كييف التاريخية', flag: 'https://flagcdn.com/ua.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Kyiv_%28Ukraine%29.jpg/800px-Kyiv_%28Ukraine%29.jpg' },
    { name: 'بولندا', lat: 52.23, lon: 21.01, hint: 'بلد تاريخي في أوروبا الوسطى وعاصمتها وارسو', flag: 'https://flagcdn.com/pl.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Warsaw_%28Poland%29.jpg/800px-Warsaw_%28Poland%29.jpg' },
    { name: 'رومانيا', lat: 44.43, lon: 26.10, hint: 'بلد القلاع والغابات وعاصمتها بوخارست', flag: 'https://flagcdn.com/ro.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Bucharest_%28Romania%29.jpg/800px-Bucharest_%28Romania%29.jpg' },
    { name: 'كازاخستان', lat: 51.18, lon: 71.45, hint: 'أكبر دولة في آسيا الوسطى وعاصمتها نور سلطان', flag: 'https://flagcdn.com/kz.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Astana_%28Kazakhstan%29.jpg/800px-Astana_%28Kazakhstan%29.jpg' },
    { name: 'أوزبكستان', lat: 41.31, lon: 69.28, hint: 'بلد المدن التاريخية مثل سمرقند وبخارى', flag: 'https://flagcdn.com/uz.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Samarkand_%28Uzbekistan%29.jpg/800px-Samarkand_%28Uzbekistan%29.jpg' },
    { name: 'باكستان', lat: 33.68, lon: 73.04, hint: 'بلد الجبال العالية والثقافات المتنوعة وعاصمتها إسلام أباد', flag: 'https://flagcdn.com/pk.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Islamabad_%28Pakistan%29.jpg/800px-Islamabad_%28Pakistan%29.jpg' },
    { name: 'نيجيريا', lat: 9.06, lon: 7.49, hint: 'أكبر دولة في أفريقيا من حيث السكان وعاصمتها أبوجا', flag: 'https://flagcdn.com/ng.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Abuja_%28Nigeria%29.jpg/800px-Abuja_%28Nigeria%29.jpg' },
    { name: 'جنوب أفريقيا', lat: -25.75, lon: 28.23, hint: 'بلد التنوع الطبيعي وعاصمتها بريتوريا', flag: 'https://flagcdn.com/za.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Cape_Town_%28South_Africa%29.jpg/800px-Cape_Town_%28South_Africa%29.jpg' },
    { name: 'كينيا', lat: -1.29, lon: 36.82, hint: 'بلد السافانا والحياة البرية وعاصمتها نيروبي', flag: 'https://flagcdn.com/ke.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Nairobi_%28Kenya%29.jpg/800px-Nairobi_%28Kenya%29.jpg' },
    { name: 'إثيوبيا', lat: 9.03, lon: 38.74, hint: 'بلد الحضارة القديمة والكنائس المنحوتة في الصخر', flag: 'https://flagcdn.com/et.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Lalibela_%28Ethiopia%29.jpg/800px-Lalibela_%28Ethiopia%29.jpg' },
    { name: 'تنزانيا', lat: -6.17, lon: 35.74, hint: 'بلد جبل كليمنجارو ومحميات الحياة البرية', flag: 'https://flagcdn.com/tz.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Kilimanjaro_%28Tanzania%29.jpg/800px-Kilimanjaro_%28Tanzania%29.jpg' },
    { name: 'فيتنام', lat: 21.03, lon: 105.85, hint: 'بلد الخلجان الخضراء والثقافة الغنية وعاصمتها هانوي', flag: 'https://flagcdn.com/vn.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Ha_Long_Bay_%28Vietnam%29.jpg/800px-Ha_Long_Bay_%28Vietnam%29.jpg' },
    { name: 'تايلاند', lat: 13.75, lon: 100.50, hint: 'بلد المعابد والشواطئ الاستوائية وعاصمتها بانكوك', flag: 'https://flagcdn.com/th.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Bangkok_%28Thailand%29.jpg/800px-Bangkok_%28Thailand%29.jpg' },
    { name: 'ماليزيا', lat: 3.14, lon: 101.69, hint: 'بلد الغابات المطيرة وناطحات السحاب وعاصمتها كوالالمبور', flag: 'https://flagcdn.com/my.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Kuala_Lumpur_%28Malaysia%29.jpg/800px-Kuala_Lumpur_%28Malaysia%29.jpg' },
    { name: 'الفلبين', lat: 14.60, lon: 120.98, hint: 'بلد الجزر الاستوائية والشواطئ الجميلة', flag: 'https://flagcdn.com/ph.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Manila_%28Philippines%29.jpg/800px-Manila_%28Philippines%29.jpg' },
    { name: 'بيرو', lat: -12.06, lon: -77.04, hint: 'موطن إمبراطورية الإنكا وماتشو بيتشو', flag: 'https://flagcdn.com/pe.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Machu_Picchu_%28Peru%29.jpg/800px-Machu_Picchu_%28Peru%29.jpg' },
    { name: 'تشيلي', lat: -33.45, lon: -70.66, hint: 'بلد الضيق الطويل في أمريكا الجنوبية وعاصمتها سانتياغو', flag: 'https://flagcdn.com/cl.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Santiago_%28Chile%29.jpg/800px-Santiago_%28Chile%29.jpg' },
    { name: 'كولومبيا', lat: 4.60, lon: -74.08, hint: 'بلد القهوة والتنوع الطبيعي وعاصمتها بوغوتا', flag: 'https://flagcdn.com/co.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Bogota_%28Colombia%29.jpg/800px-Bogota_%28Colombia%29.jpg' },
    { name: 'فنزويلا', lat: 10.48, lon: -66.90, hint: 'بلد شلالات الملاك والنفط وعاصمتها كراكاس', flag: 'https://flagcdn.com/ve.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Angel_Falls_%28Venezuela%29.jpg/800px-Angel_Falls_%28Venezuela%29.jpg' },
    { name: 'نيوزيلندا', lat: -41.28, lon: 174.77, hint: 'بلد الجمال الطبيعي والمناظر الخلابة والماوري', flag: 'https://flagcdn.com/nz.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Auckland_%28New_Zealand%29.jpg/800px-Auckland_%28New_Zealand%29.jpg' },
    { name: 'أستراليا', lat: -35.28, lon: 149.13, hint: 'بلد الكنغر والكوالا والشواطئ الذهبية', flag: 'https://flagcdn.com/au.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Sydney_Opera_House_%28Australia%29.jpg/800px-Sydney_Opera_House_%28Australia%29.jpg' },
    { name: 'إيران', lat: 35.69, lon: 51.39, hint: 'بلد الحضارة الفارسية القديمة وعاصمتها طهران', flag: 'https://flagcdn.com/ir.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Persepolis_%28Iran%29.jpg/800px-Persepolis_%28Iran%29.jpg' },
    { name: 'أفغانستان', lat: 34.53, lon: 69.17, hint: 'بلد الجبال الوعرة والتاريخ العريق وعاصمتها كابول', flag: 'https://flagcdn.com/af.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Kabul_%28Afghanistan%29.jpg/800px-Kabul_%28Afghanistan%29.jpg' },
    { name: 'نيبال', lat: 27.70, lon: 85.32, hint: 'بلد جبل إيفرست والثقافة الهندوسية', flag: 'https://flagcdn.com/np.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Everest_%28Nepal%29.jpg/800px-Everest_%28Nepal%29.jpg' },
    { name: 'بنغلاديش', lat: 23.81, lon: 90.41, hint: 'بلد الأنهار والمزارع الخضراء وعاصمتها دكا', flag: 'https://flagcdn.com/bd.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Dhaka_%28Bangladesh%29.jpg/800px-Dhaka_%28Bangladesh%29.jpg' },
    { name: 'ميانمار', lat: 19.76, lon: 96.08, hint: 'بلد الباغودات الذهبية وعاصمتها نايبيداو', flag: 'https://flagcdn.com/mm.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Shwedagon_Pagoda_%28Myanmar%29.jpg/800px-Shwedagon_Pagoda_%28Myanmar%29.jpg' },
    { name: 'سريلانكا', lat: 6.93, lon: 79.85, hint: 'جوهرة المحيط الهندي والشواطئ الاستوائية', flag: 'https://flagcdn.com/lk.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Sigiriya_%28Sri_Lanka%29.jpg/800px-Sigiriya_%28Sri_Lanka%29.jpg' },
    { name: 'ليبيا', lat: 32.88, lon: 13.19, hint: 'بلد الصحراء والآثار الرومانية وعاصمتها طرابلس', flag: 'https://flagcdn.com/ly.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Leptis_Magna_%28Libya%29.jpg/800px-Leptis_Magna_%28Libya%29.jpg' },
    { name: 'السودان', lat: 15.59, lon: 32.54, hint: 'بلد النيلين والتنوع الثقافي وعاصمتها الخرطوم', flag: 'https://flagcdn.com/sd.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Khartoum_%28Sudan%29.jpg/800px-Khartoum_%28Sudan%29.jpg' },
    { name: 'اليمن', lat: 15.36, lon: 44.20, hint: 'بلد الحضارة السبئية ومدينة صنعاء القديمة', flag: 'https://flagcdn.com/ye.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Sanaa_%28Yemen%29.jpg/800px-Sanaa_%28Yemen%29.jpg' },
    { name: 'الصومال', lat: 2.04, lon: 45.34, hint: 'بلد القرن الأفريقي وعاصمتها مقديشو', flag: 'https://flagcdn.com/so.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Mogadishu_%28Somalia%29.jpg/800px-Mogadishu_%28Somalia%29.jpg' },
    { name: 'جيبوتي', lat: 11.59, lon: 43.15, hint: 'بلد مضيق باب المندب والبحيرات المالحة', flag: 'https://flagcdn.com/dj.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Djibouti_City_%28Djibouti%29.jpg/800px-Djibouti_City_%28Djibouti%29.jpg' },
    { name: 'إريتريا', lat: 15.33, lon: 38.93, hint: 'بلد السواحل الإفريقية وعاصمتها أسمرة', flag: 'https://flagcdn.com/er.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Asmara_%28Eritrea%29.jpg/800px-Asmara_%28Eritrea%29.jpg' },
    { name: 'غانا', lat: 5.60, lon: -0.19, hint: 'بلد الساحل الذهبي والتاريخ الأفريقي العريق', flag: 'https://flagcdn.com/gh.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Accra_%28Ghana%29.jpg/800px-Accra_%28Ghana%29.jpg' },
    { name: 'السنغال', lat: 14.69, lon: -17.44, hint: 'بلد الغروب الجميل وعاصمتها داكار', flag: 'https://flagcdn.com/sn.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Dakar_%28Senegal%29.jpg/800px-Dakar_%28Senegal%29.jpg' },
    { name: 'مالي', lat: 12.65, lon: -8.00, hint: 'بلد التمبكتو والصحراء الكبرى', flag: 'https://flagcdn.com/ml.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Timbuktu_%28Mali%29.jpg/800px-Timbuktu_%28Mali%29.jpg' },
    { name: 'النيجر', lat: 13.51, lon: 2.12, hint: 'بلد الصحراء الكبرى وعاصمتها نيامي', flag: 'https://flagcdn.com/ne.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Niamey_%28Niger%29.jpg/800px-Niamey_%28Niger%29.jpg' },
    { name: 'تشاد', lat: 12.13, lon: 15.05, hint: 'بلد بحيرة تشاد والسهول الواسعة', flag: 'https://flagcdn.com/td.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/N%27Djamena_%28Chad%29.jpg/800px-N%27Djamena_%28Chad%29.jpg' },
    { name: 'الكاميرون', lat: 3.85, lon: 11.50, hint: 'بلد إفريقيا الصغيرة وعاصمتها ياوندي', flag: 'https://flagcdn.com/cm.svg', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Yaounde_%28Cameroon%29.jpg/800px-Yaounde_%28Cameroon%29.jpg' }
];

const worldCountriesDatabase = countryData.map(c => ({ ...c }));

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
    // 1. لعبة الاختباء
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
    // 3. لعبة ريبيكا
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
    // 4. لعبة تخمين البلد (مع تحميل الصور عبر Buffer)
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
                    let imageUrl = countryObj.image;

                    // تحميل الصورة وتحويلها إلى Buffer
                    let response = await fetch(imageUrl);
                    let buffer = await response.buffer();
                    let attachment = new AttachmentBuilder(buffer, { name: 'country.jpg' });

                    let roundTimeSeconds = 25;
                    let endTimeStamp = Math.floor(Date.now() / 1000) + roundTimeSeconds;

                    const guessEmbed = new EmbedBuilder()
                        .setTitle(`◆ لعبة تخمين البلد الجغرافي (الجولة ${round}/6)`)
                        .setDescription(`لديك ${roundTimeSeconds} ثانية لتخمين اسم الدولة من الصورة!\n\n💡 تلميح: \`${countryObj.hint}\`\n\n⏳ **ينتهي وقت الجولة خلال:** <t:${endTimeStamp}:R>`)
                        .setThumbnail(countryObj.flag)
                        .setImage('attachment://country.jpg')
                        .setColor(THEME_COLOR);

                    let roundMsg = await message.channel.send({ embeds: [guessEmbed], files: [attachment] });

                    let correctAnswers = [];
                    let answerTimestamps = new Map();

                    let filter = m => playersMap.has(m.author.id) && !m.author.bot;
                    let chatCollector = message.channel.createMessageCollector({ filter, time: roundTimeSeconds * 1000 });

                    chatCollector.on('collect', m => {
                        let userAns = cleanArabic(m.content);

                        let matchedCountry = worldCountriesDatabase.find(c => cleanArabic(c.name) === userAns);
                        if (matchedCountry) {
                            const replyEmbed = new EmbedBuilder()
                                .setDescription(`<@${m.author.id}> 🌍 **${matchedCountry.name}**`)
                                .setThumbnail(matchedCountry.flag)
                                .setColor(THEME_COLOR);
                            message.channel.send({ embeds: [replyEmbed] }).catch(() => {});
                        }

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
                        .setThumbnail(countryObj.flag)
                        .setColor(THEME_COLOR);

                    await message.channel.send({ embeds: [roundEmbed] });
                    await new Promise(res => setTimeout(res, 3000));
                }

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
                console.error('❌ خطأ في لعبة التخمين:', error);
                await message.channel.send('❌ حدث خطأ أثناء تحميل الصور، يرجى المحاولة مرة أخرى.');
            } finally {
                activeGames.delete(guildId);
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
