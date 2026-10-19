(() => {
  'use strict';

  const kit = (window.NileSkyKit = window.NileSkyKit || {});

  const LINES = {
    scorching: [
      'جو نار ما بيطفيها إلا مروحة وكباية عصير بارد.',
      'الشمس اليوم في مزاج حرب، والظل هو الصاحب الوحيد.',
      'حر يخلي حتى الظل يدور ليه ظل.'
    ],
    hot: [
      'جو دافي زيادة، مناسب لعصير ليمون تحت شجرة.',
      'حرارة بتتحمل، وكباية كركدي بارد بتصلحها.',
      'نهار طويل ودافي كأنه ينتظر شاي بالنعناع بعد العصر.'
    ],
    warm: [
      'جو حلو لجبنة قهوة في الحوش مع الجيران.',
      'طقس معتدل بيستاهل مشوار بدون تعب.',
      'يوم هادي كأنه سلام بين الشمس والناس.'
    ],
    mild: [
      'الجو كأنه فنجان قهوة دافي على بلكونة.',
      'نسمة هادية ولبسة خفيفة وبال مرتاح.',
      'طقس لطيف زي كلمة طيبة في الصباح.'
    ],
    cool: [
      'برد خفيف بيحب كباية ساخنة وجاكيت خفيف.',
      'هواء بارد كأنه الشتاء بيسلم من بعيد.',
      'جو منعش يصلح لمشي طويل وشاي ساخن.'
    ],
    cold: [
      'برد بيطالب ببطانية وشاي بالنعناع.',
      'جو بيعلّم قيمة الجاكيت.',
      'برد يخلي الشاي أحلى مرتين.'
    ],
    rain: [
      'مطر بيغسل الحر ويفتح ريحة التراب.',
      'السماء بتحكي بالمطر والأرض بتسمع.',
      'جو مطر وعطر تراب، مناسب لشاي وأغنية قديمة.'
    ],
    storm: [
      'رعد وبرق والسماء بتعمل حفلة.',
      'جو عاصف، البيت اليوم هو أحسن مكان.'
    ],
    dust: [
      'غبار يرسم الجو بلون الرمل، والكمامة هي الحل.',
      'هبوب ورمل في الهواء، يوم للبيت والشباك المقفول.',
      'الدنيا لابسة طرحة رمل.'
    ],
    snow: [
      'ثلج يحوّل الدنيا لورقة بيضاء.',
      'جو أبيض وساكت كأن الدنيا بتهمس.'
    ]
  };

  const HUMID_TAIL = ' والرطوبة عالية فالهواء تقيل.';
  const WINDY_TAIL = ' ورياح نشطة بتلعب بكل شيء.';

  let lastChoice = '';

  function randomFrom(list) {
    let choice = list[0];
    for (let tries = 0; tries < 6; tries++) {
      choice = list[Math.floor(Math.random() * list.length)];
      if (choice !== lastChoice) break;
    }
    lastChoice = choice;
    return choice;
  }

  function bandFor(report) {
    const family = report.weather[0].main;
    const degrees = report.main.temp;
    if (family === 'Thunderstorm') return 'storm';
    if (family === 'Rain' || family === 'Drizzle') return 'rain';
    if (family === 'Snow') return 'snow';
    if (['Dust', 'Sand', 'Haze', 'Smoke'].includes(family)) return 'dust';
    if (degrees >= 40) return 'scorching';
    if (degrees >= 34) return 'hot';
    if (degrees >= 27) return 'warm';
    if (degrees >= 18) return 'mild';
    if (degrees >= 10) return 'cool';
    return 'cold';
  }

  kit.moodLine = (report) => {
    const band = bandFor(report);
    let sentence = randomFrom(LINES[band]);

    const weatherBands = ['rain', 'storm', 'dust', 'snow'];
    if (!weatherBands.includes(band)) {
      const humidity = report.main.humidity;
      const windKmh = report.wind.speed * 3.6;
      const base = sentence.replace(/\.$/, '');
      if (humidity >= 70 && report.main.temp >= 27) sentence = base + HUMID_TAIL;
      else if (windKmh >= 30) sentence = base + WINDY_TAIL;
    }
    return sentence;
  };
})();
