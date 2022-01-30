const STROKE_MAP = {};
const COULD_BE_ANSWER = [];
$( document ).ready( () => {

  const DEFAULT_WIDTH = 2048;
  const TEMPLATE_GUESS = document.querySelector('#template-guess');
  const MAX_STROKE = 20;

  var ANSWER = null;
  var ANSWER_PATH = null;

  function SelectAnswer() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const base = new Date();
    base.setYear(2021, 1, 1);
    base.setHours(0, 0, 0, 0);

    const diff = now - base;

    const rng = new Math.seedrandom(diff);

    const index = Math.floor(COULD_BE_ANSWER.length * rng());
    ANSWER = COULD_BE_ANSWER[index];
    console.log(ANSWER);
    ANSWER_PATH = CreatePath(ANSWER);
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

    context.stroke(path);
    context.clip(ANSWER_PATH);
    context.fill(path);

    div_result.append(clone);

    if (guess === ANSWER) {
      message_element.text('恭喜你答對了！');
      message_element.show();
    }

    window.scrollTo(0,document.body.scrollHeight);
  }

  async function LoadWords() {
    const request = new Request('./word_stroke.json');
    const form = $( '#form-guess' );
    form.hide();
    try {
      const response = await fetch(request);
      const json_object = await response.json();
      console.log(Object.keys(json_object).length);

      for (word in json_object) {
        const stroke_list = json_object[word];
        if (stroke_list.length <= MAX_STROKE) {
          COULD_BE_ANSWER.push(word);
        }
        STROKE_MAP[word] = json_object[word];
      }

      COULD_BE_ANSWER.sort();
      console.log(COULD_BE_ANSWER.length);

      SelectAnswer();

      console.log(ANSWER);

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
        console.log(e);
        e.preventDefault();

        let guess = $( '#text-guess' ).val();
        if (guess.length != 1) {
          return;
        }

        Guess(guess);
      }
    );

    LoadWords();
  }

  OnDocumentReady();

});
