
import App from './App';

const isDevelop: Boolean = true;

const game = new App();

if(isDevelop) { window.game = game; }