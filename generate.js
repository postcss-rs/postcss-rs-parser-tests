const fs = require("fs");
const path = require("path");
const jsonify = require("./jsonify");
const postcss = require("postcss");
// const file = fs.readFileSync("./custom-cases/simple.css", { encoding: "utf-8" });

function generate(node, level, source) {
  const { type, nodes } = node;
  let string = "";
  switch (type) {
    case "root": {
      string += generateRoot(node, level, source);
      break;
    }
    case "decl": {
      string += generateDeclaration(node, level, source);
      break;
    }
    case "rule": {
      string += generateRule(node, level, source);
      break;
    }
    case "atrule": {
      string += generateAtRule(node, level, source);
      break;
    }
    default: {
      break;
    }
  }
  if (nodes && nodes.length) {
    nodes.forEach(child => {
      string += generate(child, level + 1, source);
    });
  }
  return string;
}

// 114.558µs
// Root@0..22
//   Rule@1..20
//     Selector`a`@1..2
//     Decl@6..18
//       prop: `color`@6..11
//       value: `black`@13..18

function generateRoot(node, level, source) {
  let string = "";
  const {
    source: { start, end },
  } = node;
  string += `${" ".repeat(level * 2)}Root@${start.offset}..${source.length}\n`;
  return string;
}
// original postcss parser end offset is inclusive, so we need to add one to compatible with rust `range`
function generateRule(node, level, source) {
  const {
    source: { start, end },
  } = node;
  let string = "";
  string += `${" ".repeat(level * 2)}Rule@${start.offset}..${end.offset + 1}\n`;
  string += `${" ".repeat((level + 1) * 2)}selector: \`${node.raws?.selector?.raw ?? node.selector}\`\n`;
  return string;
}

function generateAtRule(node, level, source) {
  const {
    source: { start, end },
  } = node;
  let string = "";
  string += `${" ".repeat(level * 2)}AtRule@${start.offset}..${end.offset + 1}\n`;
  string += `${" ".repeat((level + 1) * 2)}name: \`${node.name}\`\n`;
  string += `${" ".repeat((level + 1) * 2)}params: \`${node.raws?.params?.raw ?? node.params}\`\n`;
  return string;
}

function generateDeclaration(node, level, source) {
  const {
    source: { start, end },
  } = node;
  let string = "";
  string += `${" ".repeat(level * 2)}Declaration@${start.offset}..${end.offset + 1}\n`;
  string += `${" ".repeat((level + 1) * 2)}prop: \`${node.prop}\`\n`;
  string += `${" ".repeat((level + 1) * 2)}value: \`${node.raws?.value?.raw ?? node.value}${
    node.important ? node.raws.important ?? " !important" : ""
  }\`\n`;
  return string;
}
const dir = process.argv[2];
let fileList = fs.readdirSync(dir);
fileList.forEach(fileName => {
  const concatPath = `${dir}/${fileName}`;
  try {
    let file = fs.readFileSync(concatPath).toString();
    const root = postcss.parse(file);
    const astFile = generate(root, 0, file);
    fs.writeFileSync(dir + "/" + path.parse(fileName).name + ".ast", astFile);
  } catch (err) {
    console.error('error when try to generate the ast of ' + concatPath)
    console.error(err);
  }
});
