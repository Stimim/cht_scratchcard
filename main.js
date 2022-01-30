$( document ).ready( () => {

  const DEFAULT_WIDTH = 2048;
  const TEMPLATE_GUESS = document.querySelector('#template-guess');
  const STROKE_MAP = {};
  const COULD_BE_ANSWER = [];
  const MAX_STROKE = 15;
  const FORMATTER = new Intl.NumberFormat('zh-TW', {style: 'percent'})

  var ANSWER = null;
  var ANSWER_PATH = null;
  var ANSWER_PIXEL_COUNT = 0;
  var TODAY = null;

  var GUESS_HISTORY = [];

  function SelectAnswer() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    TODAY = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    const base = new Date();
    base.setYear(2021, 1, 1);
    base.setHours(0, 0, 0, 0);

    const diff = now - base;

    const rng = new Math.seedrandom(diff);

    const index = Math.floor(COULD_BE_ANSWER.length * rng());
    ANSWER = COULD_BE_ANSWER[index];
    ANSWER_PATH = CreatePath(ANSWER);

    // Draw the answer in memory, to count number of pixels
    const clone = TEMPLATE_GUESS.content.cloneNode(true);
    const canvas = clone.querySelector('canvas');
    const context = canvas.getContext('2d');
    const scale = canvas.width / DEFAULT_WIDTH;

    context.scale(scale, scale);
    context.fill(ANSWER_PATH);

    ANSWER_PIXEL_COUNT = 0;
    const image_data = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image_data.data.length; i += 4) {
      if (image_data.data[i + 3] !== 0) {
        ANSWER_PIXEL_COUNT ++;
      }
    }
  }


  function CreatePath(word) {
    const stroke_list = STROKE_MAP[word];
    let path = new Path2D();
    for (stroke of stroke_list) {
      for (op of stroke) {
        switch (op[0]) {
          case 0:
            path.moveTo(op[1], op[2]);
            break;
          case 1:
            path.lineTo(op[1], op[2]);
            break;
          case 2:
            path.quadraticCurveTo(op[1], op[2], op[3], op[4]);
            break;
          case 3:
            path.bezierCurveTo(op[1], op[2], op[3], op[4], op[5], op[6]);
            break;
        }
      }
    }
    return path;
  }

  function Guess(guess) {
    const message_element = $( '#message' );
    if (guess in STROKE_MAP) {
      if (COULD_BE_ANSWER.indexOf(guess) >= 0) {
        message_element.hide();
      } else {
        message_element.text(`「${guess}」筆順超過 ${MAX_STROKE} 畫。`);
        message_element.show();
        return;
      }
    } else {
      message_element.text(`「${guess}」不是常用字。`);
      message_element.show();
      return;
    }
    const div_result = $( '#result' );
    const clone = TEMPLATE_GUESS.content.cloneNode(true);
    const canvas = clone.querySelector('canvas');
    const context = canvas.getContext('2d');
    const scale = canvas.width / DEFAULT_WIDTH;

    context.scale(scale, scale);
    context.lineWidth = 2;

    const path = CreatePath(guess);

    context.save();
    context.clip(ANSWER_PATH);
    context.fill(path);
    context.restore();

    let pixel_count = 0;
    const image_data = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image_data.data.length; i += 4) {
      if (image_data.data[i + 3] !== 0) {
        pixel_count ++;
      }
    }

    context.stroke(path);
    div_result.append(clone);

    if (guess === ANSWER) {
      message_element.text('恭喜你答對了！');
      message_element.show();
      GUESS_HISTORY.push('100%');
    } else {
      const percent = FORMATTER.format(pixel_count / ANSWER_PIXEL_COUNT);
      message_element.text(`你透過「${guess}」看到 ${percent} 的答案。`);
      message_element.show();
      GUESS_HISTORY.push(percent);
    }

    window.scrollTo(0, document.body.scrollHeight);
  }

  async function LoadWords() {
    const request = new Request('./word_stroke.json');
    const form = $( '#form-guess' );
    form.hide();
    try {
      const response = await fetch(request);
      const json_object = await response.json();

      for (word in json_object) {
        const stroke_list = json_object[word];
        if (stroke_list.length <= MAX_STROKE) {
          COULD_BE_ANSWER.push(word);
        }
        STROKE_MAP[word] = json_object[word];
      }

      COULD_BE_ANSWER.sort();

      SelectAnswer();

      // Everything is ready, show form to start playing.
      $( '#message' ).hide();
      form.show();
    } catch ( error ) {
      console.error(error);
    }
  }

  function OnDocumentReady() {
    $( '#form-guess' ).submit(
      (e) => {
        e.preventDefault();

        let guess = $( '#text-guess' ).val();
        if (guess.length != 1) {
          return;
        }

        Guess(guess);
      }
    );

    $( '#button-share' ).click( () => {
      const text = `${TODAY}\n${GUESS_HISTORY.join('\n')}`;
      navigator.clipboard.writeText(text);
    });
    $( '#dialog-help' ).dialog({
      position: {
        my: 'center top',
        at: 'center bottom',
        of: document.querySelector('header'),
      }
    });
    $( '#button-help' ).click(() => {
      $( '#dialog-help' ).dialog();
    });

    LoadWords();
  }

  OnDocumentReady();
});
