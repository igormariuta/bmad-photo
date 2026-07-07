const COLOR_PROPERTIES = new Set([
  "color",
  "background",
  "backgroundColor",
  "borderColor",
  "fill",
  "stroke",
]);

const SPACING_PROPERTIES = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "top",
  "right",
  "bottom",
  "left",
]);

const RADIUS_PROPERTIES = new Set(["borderRadius"]);

const TOKENED_PROPERTIES = new Set([
  ...COLOR_PROPERTIES,
  ...SPACING_PROPERTIES,
  ...RADIUS_PROPERTIES,
]);

const TOKEN_VAR_PATTERN = /^var\(--m-[a-zA-Z0-9-]+\)$/;

function getStaticTemplateText(node) {
  if (node.expressions.length > 0) {
    return null;
  }
  return node.quasis.map((quasi) => quasi.value.raw).join("");
}

function isTokenReference(node) {
  if (node.type === "Literal") {
    // Numbers can never be a var(--m-*) reference; only a full string match
    // (not a substring) counts as one.
    return typeof node.value === "string" && TOKEN_VAR_PATTERN.test(node.value);
  }
  if (node.type === "TemplateLiteral") {
    const text = getStaticTemplateText(node);
    return text === null ? true : TOKEN_VAR_PATTERN.test(text);
  }
  // Identifiers, member/call expressions, conditionals, etc. can't be
  // statically verified — don't flag them to avoid false positives.
  return true;
}

function isLiteralValue(node) {
  return (
    node.type === "Literal" ||
    (node.type === "TemplateLiteral" && node.expressions.length === 0)
  );
}

function getPropertyName(key) {
  if (key.type === "Identifier") {
    return key.name;
  }
  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }
  return null;
}

/** @type {import("eslint").Rule.RuleModule} */
export const noArbitraryStyleValueRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow literal color/spacing/radius values in JSX inline style props; require var(--m-*) design tokens.",
    },
    schema: [],
    messages: {
      arbitraryStyleValue:
        "Use a design token (var(--m-*)) for '{{property}}' instead of a literal value.",
    },
  },
  create(context) {
    return {
      'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression'(
        node,
      ) {
        for (const prop of node.properties) {
          if (prop.type !== "Property") {
            continue;
          }
          const propertyName = getPropertyName(prop.key);
          if (!propertyName || !TOKENED_PROPERTIES.has(propertyName)) {
            continue;
          }
          if (isLiteralValue(prop.value) && !isTokenReference(prop.value)) {
            context.report({
              node: prop.value,
              messageId: "arbitraryStyleValue",
              data: { property: propertyName },
            });
          }
        }
      },
    };
  },
};

export default noArbitraryStyleValueRule;
