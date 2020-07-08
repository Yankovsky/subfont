const downloadGoogleFonts = require('./lib/downloadGoogleFonts')

var a = downloadGoogleFonts(
  {
    'font-family': 'Roboto',
  },
  {
    text: 'x	 (),-./0123456789:;ACFGIPRSTWYabcdeghijklmnoprstuy~ «»АБВГДЕЗИЙКЛМНОПРСТУФХЦЧШЫЬЯабвгдежзийклмнопрстуфхцчшщыьэюяё—₽№'
  }
)
a.then(x => console.log(x))

