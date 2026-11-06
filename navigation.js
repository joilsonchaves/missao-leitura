(function(root){
'use strict';
class BackTrail{
  constructor(initial){this.current=initial;this.stack=[];}
  key(route){return route.tab+'|'+(route.tab==='aprender'?route.view||'practice':'');}
  visit(route){if(this.key(route)===this.key(this.current))return;this.stack.push(this.current);if(this.stack.length>50)this.stack.shift();this.current=route;}
  back(){this.current=this.stack.pop()||{tab:'inicio'};return this.current;}
}
root.BackTrail=BackTrail;
})(typeof window==='undefined'?globalThis:window);
