import { Notyf } from 'notyf';

export const notification = new Notyf({
    duration: 0,
    position: {
      x: 'right',
      y: 'bottom'
    },
    types: [
        {
            type: 'success',
            background:'#0f5132',
            icon: false
        },
        {
            type: 'error',
            background: '#a71313',
            icon: false
        }
    ],
    dismissible: true
});