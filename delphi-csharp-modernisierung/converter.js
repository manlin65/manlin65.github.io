"use strict";

// This grammar accepts one Integer function as a snippet or in a minimal unit.
function convertPascalFunction(source) {
  const tokens = [...source.matchAll(/\/\/[^\r\n]*|[a-z_][a-z_0-9]*|[0-9]+|:=|<=|>=|<>|\s+|./gi)]
    .filter(([text]) => !/^\s|^\/\//.test(text));
  const pascalKeywords = new Set(("and array as asm begin case class const constructor destructor " +
    "dispinterface div do downto else end except exports file finalization finally for function goto if " +
    "implementation in inherited initialization inline interface is label library mod nil not object of or " +
    "out packed procedure program property raise record repeat resourcestring set shl shr string then " +
    "threadvar to try type unit until uses var while with xor integer result self true false").split(" "));
  let cursor = 0;

  function fail(expected, token = tokens[cursor]) {
    const line = source.slice(0, token?.index ?? source.length).split(/\r\n|\r|\n/).length;
    throw new Error(`Zeile ${line}: ${expected}`);
  }

  function take(text) {
    if (tokens[cursor]?.[0].toLowerCase() !== text) return false;
    cursor++;
    return true;
  }

  function expect(text, message = `„${text}“ erwartet.`) {
    if (!take(text)) fail(message);
  }

  function identifier() {
    const token = tokens[cursor];
    const value = token?.[0];
    if (!value || !/^[a-z_][a-z_0-9]*$/i.test(value) || pascalKeywords.has(value.toLowerCase())) {
      fail("Ein einfacher Pascal-Bezeichner wird erwartet.");
    }
    cursor++;
    return value;
  }

  function signature() {
    expect("function", "Eine einzelne function mit Integer-Parameter und Integer-Rückgabe wird erwartet.");
    const name = identifier();
    expect("(");
    if (["const", "var", "out"].includes(tokens[cursor]?.[0].toLowerCase())) {
      fail("Unterstützt wird ein einzelner Integer-Parameter ohne const, var oder out. Array-Parameter werden nicht übersetzt.");
    }
    const argument = identifier();
    if (name.toLowerCase() === argument.toLowerCase()) {
      fail("Funktionsname und Parametername müssen verschieden sein.", tokens[cursor - 1]);
    }
    expect(":");
    expect("integer", "Als Parametertyp wird nur Integer unterstützt. Array-Parameter werden nicht übersetzt.");
    expect(")", "Unterstützt wird genau ein Integer-Parameter.");
    expect(":");
    expect("integer");
    expect(";");
    return { name, argument };
  }

  function integer() {
    const negative = take("-");
    const token = tokens[cursor];
    if (!token || !/^[0-9]+$/.test(token[0])) fail("Eine dezimale Integer-Konstante wird erwartet.");
    const magnitude = Number(token[0]);
    if (magnitude > (negative ? 2147483648 : 2147483647)) {
      fail("Die Konstante liegt außerhalb des 32-Bit-Integer-Bereichs.");
    }
    cursor++;
    return String(negative ? -magnitude : magnitude);
  }

  function result() {
    expect("result", "In jedem Zweig wird eine Zuweisung an Result erwartet.");
    expect(":=");
    return integer();
  }

  const isUnit = take("unit");
  let declaration;
  if (isUnit) {
    identifier();
    expect(";");
    expect("interface");
    declaration = signature();
    expect("implementation");
  }
  const { name, argument } = signature();
  if (declaration && (declaration.name.toLowerCase() !== name.toLowerCase() ||
      declaration.argument.toLowerCase() !== argument.toLowerCase())) {
    fail("Funktionsdeklaration und Implementierung müssen übereinstimmen.");
  }

  const operators = new Map([["=", "=="], ["<>", "!="], ["<", "<"], ["<=", "<="], [">", ">"], [">=", ">="]]);
  const csharpKeywords = new Set(("abstract as base bool break byte case catch char checked class const continue " +
    "decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto " +
    "if implicit in int interface internal is lock long namespace new null object operator out override params private " +
    "protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw " +
    "true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while").split(" "));
  const csharpIdentifier = (value) => csharpKeywords.has(value) ? "@" + value : value;
  const parameter = csharpIdentifier(argument);
  const lines = [`static int ${csharpIdentifier(name)}(int ${parameter})`, "{"];

  expect("begin");
  expect("if", "Ein if mit abschließendem else wird erwartet.");
  do {
    const variable = tokens[cursor];
    if (identifier().toLowerCase() !== argument.toLowerCase()) {
      fail(`Der Vergleich muss den Parameter „${argument}“ verwenden.`, variable);
    }
    const operator = operators.get(tokens[cursor]?.[0]);
    if (!operator) fail("Ein Vergleichsoperator wird erwartet (=, <>, <, <=, > oder >=).");
    cursor++;
    const value = integer();
    expect("then");
    lines.push(`    if (${parameter} ${operator} ${value})`, `        return ${result()};`);
    expect("else", "Ein else wird erwartet. Vor else steht kein Semikolon.");
  } while (take("if"));

  lines.push("", `    return ${result()};`, "}");
  take(";");
  expect("end");
  expect(";");
  if (isUnit) {
    expect("end");
    expect(".");
  }
  if (cursor < tokens.length) fail("Nach der Funktion werden keine weiteren Deklarationen unterstützt.");

  return lines.join("\n");
}
