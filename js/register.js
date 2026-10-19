document.addEventListener('DOMContentLoaded', () => { //Создаем событие
  const form = document.querySelector('.auth-form'); //ищем на странице форму по классу auth-form и сохраняем ссылку на неё в переменную form
  if (!form) return; //если формы на странице нет, выходим из функции

  const word = "[A-Za-zА-ЯЁа-яё]{2,}(?:[-'][A-Za-zА-ЯЁа-яё]+)*"; //часть регулярки для одного слова: минимум 2 буквы, дальше можно добавить дефис или апостроф и ещё буквы

  const patterns = { //объявляем объект со всеми регулярными выражениями
    fio: new RegExp(`^${word}(?:\\s+${word}){1,2}$`), //имя и фамилия (можно и отчество): от 2 до 3 слов через пробел. Через new RegExp, потому что подставляем в неё переменную word
    phoneChars: /^\+?[\d\s()-]+$/, //проверяем, что в телефоне только допустимые символы: необязательный + в начале, дальше цифры, пробелы, скобки и дефисы
    phoneDigits: /^996[2-9]\d{8}$/, //проверяем номер после очистки: 996, затем цифра от 2 до 9, затем ещё 8 цифр (всего 12 цифр)
    email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/ //почта: символы до @, затем домен, затем точка и зона минимум из 2 букв (.com, .kg)
  };

  function normalizePhone(value) { //создаём функцию, которая превращает любой введённый номер в строку из одних цифр
    let digits = value.replace(/\D/g, ''); //удаляем всё, что не цифра (+, пробелы, скобки, дефисы) и сохраняем результат в digits
    if (digits.length === 10 && digits.startsWith('0')) { //если цифр ровно 10 и они начинаются с нуля, значит это местный формат (0502024068)
      digits = '996' + digits.slice(1); //отрезаем ноль методом .slice(1) и добавляем впереди код страны: 0502024068 -> 996502024068
    }
    return digits; //возвращаем получившуюся строку цифр
  }

  function formatPhone(value) { //создаём функцию, которая делает из номера красивую строку для отправки на сервер
    const d = normalizePhone(value); //приводим номер к виду из одних цифр и сохраняем в d
    return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`; //режем строку на куски методом .slice() и склеиваем с пробелами: +996 502 024 068
  }

  const fields = [ //объявляем массив полей, которые будем проверять
    {
      el: form.querySelector('#fullname'), //ищем внутри формы поле имени по id fullname
      check: v => patterns.fio.test(v.trim()), //убираем пробелы по краям методом .trim() и проверяем строку регуляркой через .test(), он возвращает true или false
      msg: 'Введите имя и фамилию (только буквы)' //текст, который покажем при ошибке
    },
    {
      el: form.querySelector('#email'), //ищем поле почты по id email
      check: v => patterns.email.test(v.trim()), //проверяем почту регуляркой email
      msg: 'Введите корректный e-mail' //текст ошибки для почты
    },
    {
      el: form.querySelector('#phone'), //ищем поле телефона по id phone
      check: v => patterns.phoneChars.test(v.trim()) && patterns.phoneDigits.test(normalizePhone(v.trim())), //проверяем два условия сразу: в номере только допустимые символы И после очистки он подходит под формат 996 + 9 цифр
      msg: 'Введите номер в формате +996 XXX XXX XXX' //текст ошибки для телефона
    },
    {
      el: form.querySelector('#password'), //ищем поле пароля по id password
      check: v => v.length >= 8, //пароль должен быть не короче 8 символов
      msg: 'Пароль должен быть не короче 8 символов' //текст ошибки для пароля
    },
    {
      el: form.querySelector('#password_confirm'), //ищем поле повторного пароля по id password_confirm
      check: v => v === form.querySelector('#password').value && v.length >= 8, //значение должно совпадать с полем пароля (строгое сравнение ===) и быть не короче 8 символов
      msg: 'Пароли не совпадают' //текст ошибки для повторного пароля
    },
    {
      el: form.querySelector('input[name="terms"]'), //ищем чекбокс согласия по атрибуту name="terms"
      check: (v, el) => el.checked, //для чекбокса смотрим не на текст, а на то, стоит ли галочка (el.checked). Элемент el приходит вторым параметром из validateField
      msg: 'Необходимо согласие на обработку данных' //текст ошибки для чекбокса
    }
  ].filter(f => f.el); //метод .filter() убирает из списка поля, которых нет на странице, чтобы код не ломался

  function getErrorBox(el) { //создаём функцию, которая находит или создаёт блок для текста ошибки под полем
    const group = el.closest('.form-group, .form-options') || el.parentElement; //ищем ближайшую обёртку поля методом .closest(), если не нашли, берём просто родителя
    let box = group.querySelector('.error-msg'); //пробуем найти внутри обёртки уже созданный блок ошибки
    if (!box) { //если блока ещё нет, создаём его
      box = document.createElement('div'); //создаём пустой div
      box.className = 'error-msg'; //даём ему класс error-msg, чтобы работали стили из CSS
      group.appendChild(box); //добавляем его в конец обёртки поля
    }
    return box; //возвращаем блок, чтобы с ним можно было работать дальше
  }

  function showError(el, message) { //создаём функцию, которая показывает ошибку
    getErrorBox(el).textContent = message; //находим блок ошибки и записываем в него текст
    el.classList.add('input-error'); //добавляем полю класс input-error для красной рамки
  }

  function clearError(el) { //создаём функцию, которая убирает ошибку
    getErrorBox(el).textContent = ''; //очищаем текст ошибки
    el.classList.remove('input-error'); //убираем класс с красной рамкой
  }

  function validateField({ el, check, msg }) { //создаём функцию проверки одного поля
    const ok = check(el.value, el); //вызываем функцию проверки, передаём ей значение поля и сам элемент
    ok ? clearError(el) : showError(el, msg); //если всё хорошо, убираем ошибку, иначе показываем её
    return ok; //возвращаем true или false, это пригодится при отправке формы
  }

  fields.forEach(field => { //перебираем все поля из массива и навешиваем на каждый обработчик событий
    const { el } = field; //достаём из объекта поля сам элемент
    el.addEventListener('blur', () => validateField(field)); //событие blur срабатывает, когда пользователь ушёл с поля, в этот момент проверяем его
    el.addEventListener('input', () => clearError(el)); //событие input срабатывает при вводе, как только пользователь снова печатает, убираем ошибку
    if (el.type === 'checkbox') el.addEventListener('change', () => clearError(el)); //у чекбокса есть ещё событие поставили или сняли галочку, на него тоже убираем ошибку
  });

  form.addEventListener('submit', e => { //вешаем обработчик на отправку формы, e это объект события
    let allValid = true; //считаем, что всё верно, пока не найдём ошибку

    fields.forEach(field => { //Проверяем все сразу, чтобы пользователь увидел все ошибки, а не только первую
      if (!validateField(field)) allValid = false; //если поле не прошло проверку, меняем allValid на false
    });

    if (!allValid) { //если есть хотя бы одна ошибка отменяем отправку формы
      e.preventDefault();
      const firstBad = form.querySelector('.input-error'); //находим первое поле с ошибкой по классу input-error
      if (firstBad) firstBad.focus(); //переводим на него курсор
      return;
    }

    const phone = form.querySelector('#phone'); //Находим поле телефона
    phone.value = formatPhone(phone.value); //приводим телефон к единому формату +996 XXX XXX XXX перед отправкой
  });
});