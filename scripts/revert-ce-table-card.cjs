const fs = require('fs');
const path = require('path');

function walkJsx(dir, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name !== 'node_modules') walkJsx(p, acc);
        else if (ent.isFile() && p.endsWith('.jsx')) acc.push(p);
    }
    return acc;
}

const jsRoot = path.join(__dirname, '..', 'resources', 'js');
let n = 0;
for (const file of walkJsx(jsRoot)) {
    let s = fs.readFileSync(file, 'utf8');
    if (!s.includes('CeTableCard')) continue;
    s = s.replace(/,\s*CeTableCard\b/g, '').replace(/\bCeTableCard\s*,\s*/g, '');
    s = s.replace(/<CeTableCard>/g, '<div className="ce-table-wrap">');
    s = s.replace(/<\/CeTableCard>/g, '</div>');
    fs.writeFileSync(file, s, 'utf8');
    n++;
    console.log(path.relative(path.join(__dirname, '..'), file));
}
console.log('reverted files:', n);
