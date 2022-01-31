$(document).ready(() => {
  const DEFAULT_WIDTH = 2048;
  const TEMPLATE_GUESS = document.querySelector("#template-guess");
  const STROKE_MAP = {};
  const COULD_BE_ANSWER = [];
  const MAX_STROKE = 15;
  const FORMATTER = new Intl.NumberFormat("zh-TW", { style: "percent" });

  //const ALPHABET = {
    //"A": "Ａ",
    //"B": "Ｂ",
    //"C": "Ｃ",
    //"D": "Ｄ",
    //"E": "Ｅ",
    //"F": "Ｆ",
    //"G": "Ｇ",
    //"H": "Ｈ",
    //"I": "Ｉ",
    //"J": "Ｊ",
    //"K": "Ｋ",
    //"L": "Ｌ",
    //"M": "Ｍ",
    //"N": "Ｎ",
    //"O": "Ｏ",
    //"P": "Ｐ",
    //"Q": "Ｑ",
    //"R": "Ｒ",
    //"S": "Ｓ",
    //"T": "Ｔ",
    //"U": "Ｕ",
    //"V": "Ｖ",
    //"W": "Ｗ",
    //"X": "Ｘ",
    //"Y": "Ｙ",
    //"Z": "Ｚ",
    //"a": "ａ",
    //"b": "ｂ",
    //"c": "ｃ",
    //"d": "ｄ",
    //"e": "ｅ",
    //"f": "ｆ",
    //"g": "ｇ",
    //"h": "ｈ",
    //"i": "ｉ",
    //"j": "ｊ",
    //"k": "ｋ",
    //"l": "ｌ",
    //"m": "ｍ",
    //"n": "ｎ",
    //"o": "ｏ",
    //"p": "ｐ",
    //"q": "ｑ",
    //"r": "ｒ",
    //"s": "ｓ",
    //"t": "ｔ",
    //"u": "ｕ",
    //"v": "ｖ",
    //"w": "ｗ",
    //"x": "ｘ",
    //"y": "ｙ",
    //"z": "ｚ",
  //};

  var ANSWER = null;
  var ANSWER_PATH = null;
  var ANSWER_PIXEL_COUNT = 0;
  var TODAY = null;

  var GUESS_HISTORY = [];
  var RESULT_HISTORY = [];

  const ShowWarningMessage = (message) => {
    $("#invalid-message").text(message);
    $("#invalid-message").show();
  };

  function Draw(guess, answer) {
    const div_result = $("#result");
    const clone = TEMPLATE_GUESS.content.cloneNode(true);
    const root = clone.children[0];
    const canvas = clone.querySelector("canvas");
    const context = canvas.getContext("2d");
    const scale = canvas.width / DEFAULT_WIDTH;

    // We need to put canvas on div, to make fillText work.
    div_result.append(root);

    context.scale(scale, scale);
    context.lineWidth = 2;

    const font_size = 1920;
    context.font = `100 ${font_size}px/${font_size} "Noto Sans TC", sans-serif`;

    {
      const {width} = context.measureText(answer);
      const left = (DEFAULT_WIDTH - width) / 2;
      context.textBaseline = "top";
      context.fillText(answer, left, 0);
    }

    context.globalCompositeOperation = "source-in";
    {
      const {width} = context.measureText(guess);
      const left = (DEFAULT_WIDTH - width) / 2;
      context.textBaseline = "top";
      context.fillText(guess, left, 0);
    }

    let pixel_count = 0;
    const image_data = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < image_data.data.length; i += 4) {
      if (image_data.data[i + 3] !== 0) {
        pixel_count++;
      }
    }

    context.globalCompositeOperation = "source-over";
    {
      const {width} = context.measureText(guess);
      const left = (DEFAULT_WIDTH - width) / 2;
      context.textBaseline = "top";
      context.strokeText(guess, left, 0);
    }

    if (guess === ANSWER) {
      context.beginPath();
      context.arc(
        DEFAULT_WIDTH - 256,
        DEFAULT_WIDTH - 256,
        128,
        0,
        2 * Math.PI
      );
      context.lineWidth = 32;
      context.strokeStyle = "red";
      context.stroke();
    }

    root.remove();
    return {clone: root, pixel_count};
  }

  function SelectAnswer() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    TODAY = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    const base = new Date(2021, 0, 1); // month is 0-indexed...

    const diff = now - base;

    const rng = new Math.seedrandom(diff);

    const index = Math.floor(COULD_BE_ANSWER.length * rng());
    ANSWER = COULD_BE_ANSWER[index];

    const {pixel_count} = Draw(ANSWER, ANSWER);

    ANSWER_PIXEL_COUNT = pixel_count;
  }

  function Guess(guess) {
    const message_element = $("#message");
    //if (guess in STROKE_MAP) {
      //if (COULD_BE_ANSWER.indexOf(guess) < 0) {
        //ShowWarningMessage(`「${guess}」筆順超過 ${MAX_STROKE} 畫。`);
        //return;
      //}
    //} else {
      //ShowWarningMessage(`「${guess}」不是常用字。`);
      //return;
    //}
    //if (guess in ALPHABET) {
      // guess = ALPHABET[guess];
    //}
    const div_result = $("#result");
    const {clone, pixel_count} = Draw(guess, ANSWER);
    const clone_id = div_result.children().length;
    clone.id = `guess-${clone_id}`;
    console.log(clone.id);
    div_result.append(clone);

    $(clone).css({opacity: 0}).appendTo(div_result).animate({opacity: 1});

    if (guess === ANSWER) {
      message_element.text("恭喜你答對了！");
      message_element.show();
      GUESS_HISTORY.push(guess);
      RESULT_HISTORY.push("100%");
      SaveGame();
    } else {
      const percent = FORMATTER.format(pixel_count / ANSWER_PIXEL_COUNT);
      message_element.text(`你透過「${guess}」看到 ${percent} 的答案。`);
      message_element.show();
      GUESS_HISTORY.push(guess);
      RESULT_HISTORY.push(percent);
      SaveGame();
    }

    window.scrollTo(0, document.body.scrollHeight);
  }

  function SaveGame() {
    localStorage.setItem(
      "game_data",
      JSON.stringify({
        ANSWER,
        TODAY,
        GUESS_HISTORY,
        RESULT_HISTORY,
      })
    );
  }

  function LoadGame() {
    if (typeof Storage === "undefined") {
      // local storage is not supported.
      return;
    }

    let game_data = {};
    try {
      game_data = JSON.parse(localStorage.game_data);
    } catch (error) {
      game_data = {};
    }

    if (game_data.ANSWER !== ANSWER) {
      SaveGame();
    } else {
      for (let guess of game_data.GUESS_HISTORY) {
        Guess(guess);
      }
    }
  }

  async function LoadWords() {
    const request = new Request("./word_stroke.json");
    const form = $("#form-guess");
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
      LoadGame();

      // Everything is ready, show form to start playing.
      $("#message").hide();
      form.show();
    } catch (error) {
      console.error(error);
    }
  }

  function OnDocumentReady() {
    $("#button-guess").click((e) => {
      e.preventDefault();
      const guess = $("#text-guess").val();
      if (guess.length != 1) {
        return;
      }

      Guess(guess);
    });

    $("#text-guess").change(() => {
      $("#invalid-message").hide();
      const guess = $("#text-guess").val();

      if (guess.length > 1) {
        ShowWarningMessage("請輸入單一個字！");
      }
    });

    $("#button-share").click(() => {
      const text = `${TODAY}\n${RESULT_HISTORY.join("\n")}\n${location.href}`;
      navigator.clipboard.writeText(text);
      $("#message").text("遊戲歷程已複製到剪貼簿");
      $("#message").show();
    });

    $("#button-start").click(() => $("#dialog-help").modal("hide"));
    $("#button-help").click(() => $("#dialog-help").modal("show"));

    $("#invalid-message").hide();
    $("#dialog-help").modal("show");
    LoadWords();
  }

  OnDocumentReady();
});
