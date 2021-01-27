const builds = [
  {
    input: 'src/background.js',
    output: {
      file: 'built/background/background.js',
      format: 'iife'
    }
  },
  {
    input: 'src/newtabscript.js',
    output: {
      file: 'built/newtab/newtabscript.js',
      format: 'iife'
    }
  },
  {
    input: 'src/optionsscript.js',
    output: {
      file: 'built/options/optionsscript.js',
      format: 'iife'
    }
  }
];

export default builds;
