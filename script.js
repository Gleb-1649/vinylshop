
const basket = {};
const rows = document.querySelector('#basket-lines');
const emptyRow = document.querySelector('#empty-basket');
const amount = document.querySelector('#basket-amount');
const counter = document.querySelector('#basket-quantity');
const openOrder = document.querySelector('#open-order');
const orderSection = document.querySelector('#order');
const deliveryForm = document.querySelector('#delivery-form');
const confirmation = document.querySelector('#confirmation');
const storageNotice = document.querySelector('#storage-notice');
const basketKey = 'vinyl-shop-basket';


function money(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

function showRecords(codes) {
  const shelf = document.querySelector('.record-grid');
  const template = document.querySelector('#release-template');
  shelf.replaceChildren();
  codes.forEach(function (code) {
    const record = records[code];
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('h3').textContent = record.album;
    card.querySelector('.artist').textContent = record.artist;
    card.querySelector('.release-info').textContent = record.genre + ' / ' + record.year;
    card.querySelector('.description').textContent = record.description;
    card.querySelector('.release-price').textContent = money(record.price);
    const button = card.querySelector('button');
    button.dataset.addRecord = code;
    button.setAttribute('aria-label', 'Добавить в корзину: ' + record.title);
    shelf.append(card);
  });
}

showRecords(Object.keys(records));

document.querySelector('.record-grid').addEventListener('click', function (event) {
  const button = event.target.closest('[data-add-record]');
  if (!button) return;
  const code = button.dataset.addRecord;
  basket[code] = (basket[code] || 0) + 1;
  drawBasket();
});

function addCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.append(cell);
  return cell;
}

function drawBasket(persist = true) {
  const focusedId = document.activeElement.id;
  rows.replaceChildren(emptyRow);
  const codes = Object.keys(basket);
  emptyRow.hidden = codes.length > 0;
  let sum = 0;
  let quantity = 0;

  codes.forEach(function (code) {
    const record = records[code];
    const subtotal = record.price * basket[code];
    sum += subtotal;
    quantity += basket[code];
    const row = document.createElement('tr');
    addCell(row, record.title);
    addCell(row, money(record.price));
    const quantityCell = addCell(row, '');
    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'quantity-' + code;
    input.min = '1';
    input.step = '1';
    input.value = basket[code];
    input.dataset.quantity = code;
    input.setAttribute('aria-label', 'Количество: ' + record.title);
    quantityCell.append(input);
    addCell(row, money(subtotal));
    const actions = addCell(row, '');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Удалить';
    button.dataset.remove = code;
    button.id = 'remove-' + code;
    button.setAttribute('aria-label', 'Удалить: ' + record.title);
    actions.append(button);
    rows.append(row);
  });
  amount.textContent = money(sum);
  counter.textContent = quantity;
  openOrder.disabled = codes.length === 0;
  if (codes.length === 0) orderSection.hidden = true;
  confirmation.textContent = '';
  if (persist) storeBasket();
  const focusedControl = document.getElementById(focusedId);
  if (focusedControl) {
    focusedControl.focus();
  } else if (focusedId.startsWith('remove-')) {
    document.querySelector('[data-add-record]').focus();
  }
}


rows.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && event.target.matches('[data-quantity]')) {
    event.preventDefault();
    event.target.blur();
  }
});

rows.addEventListener('change', function (event) {
  const input = event.target.closest('[data-quantity]');
  if (!input) return;
  const code = input.dataset.quantity;
  const value = Number(input.value);
  
  if (!Number.isSafeInteger(value) || value < 1 ||
      !Number.isSafeInteger(value * records[code].price)) {
    input.value = basket[code];
    return;
  }
  basket[code] = value;
  drawBasket();
});

rows.addEventListener('click', function (event) {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  delete basket[button.dataset.remove];
  drawBasket();
});

function storeBasket() {
  try {
    localStorage.setItem(basketKey, JSON.stringify(basket));
    storageNotice.textContent = '';
  } catch (error) {
    console.warn('Не удалось сохранить заказ пластинок:', error);
    storageNotice.textContent = 'Сохранение недоступно: изменения заказа могут потеряться после обновления.';
  }
}

function restoreBasket() {
  try {
    const saved = JSON.parse(localStorage.getItem(basketKey) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      storageNotice.textContent = 'Сохранённый заказ имеет неверный формат.';
      return;
    }
    
    Object.keys(records).forEach(function (code) {
      const quantity = saved[code];
      if (Number.isSafeInteger(quantity) && quantity > 0 &&
          Number.isSafeInteger(quantity * records[code].price)) {
        basket[code] = quantity;
      }
    });
  } catch (error) {
    console.warn('Не удалось загрузить заказ пластинок:', error);
    storageNotice.textContent = 'Не удалось загрузить сохранённый заказ. Добавьте пластинки заново.';
  }
}

openOrder.addEventListener('click', function () {
  if (Object.keys(basket).length === 0) return;
  orderSection.hidden = false;
  confirmation.textContent = '';
  document.querySelector('#customer-given').focus();
});

deliveryForm.addEventListener('input', function (event) {
  event.target.setCustomValidity('');
});
deliveryForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (Object.keys(basket).length === 0) return;
  const fields = deliveryForm.querySelectorAll('input, textarea');
  fields.forEach(function (field) {
    field.value = field.value.trim();
    field.setCustomValidity(field.value ? '' : 'Заполните поле.');
  });
  if (!deliveryForm.reportValidity()) return;
  Object.keys(basket).forEach(function (code) {
    delete basket[code];
  });
  drawBasket();
  deliveryForm.reset();
  confirmation.textContent = 'Заказ создан!';
  confirmation.focus();
});

restoreBasket();
drawBasket(false);
