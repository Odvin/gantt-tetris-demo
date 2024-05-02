import * as fs from 'fs';
import * as path from 'path';

import Mustache from 'mustache';

const template = `
  <!DOCTYPE html>
  <html lang="en">
  {{>head}}
    <body>
      {{>foo}}
      {{>bar}}
      <pre class="mermaid">
        {{>programPlan}}
      </pre>
      {{>scripts}}
    </body>
  </html>`;

const data = {title: 'Hello, world!', name: 'Jon', age: 23, job: 'Job X-00A'};

function _loadSharedPartials() {
  const partials = {};
  const files = fs.readdirSync('./src/templates');

  for (let file of files) {
    if (file.match(/\.partial\.mustache$/)) {
      let name = path.basename(file, '.partial.mustache');
      partials[name] = fs.readFileSync(`./src/templates/${file}`, {
        encoding: 'utf8',
      });
    }
  }

  return partials;
}

try {
  const output = Mustache.render(template, data, _loadSharedPartials());

  fs.writeFileSync('./src/index.html', output);
} catch (error) {
  console.error(error);
  throw error;
}
