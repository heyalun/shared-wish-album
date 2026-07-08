// miniprogram/utils/util.js
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return formatTime(date) + ' ' + date.toTimeString().slice(0, 5);
}

module.exports = { formatTime, formatDateTime };