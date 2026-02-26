/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

const slugify = require("slugify");
const { capitalizeFirstCharacter, camelCaseToUnderscores } = require("./util");
const { typeMapping } = require("./generator"); // Ensure typeMapping is imported if needed for 'variables'

class VariablesGenerator {
    static generateVariables(fields, annotations, mutable) {
        if (!annotations) {
            annotations = [];
        }
        return fields?.map((variable) => {
            const type = typeMapping(variable.type, variable.cardinality, variable.optional);
            let defaultValue = " = null";
            if (variable.cardinality?.toLowerCase() === "list") {
                defaultValue = " = new java.util.ArrayList<>()";
            } else if (!variable.optional) {
                switch (variable.type?.toLowerCase()) {
                    case "string":
                        defaultValue = " = \"\"";
                        break;
                    case "double":
                        defaultValue = " = 0.0";
                        break;
                    case "int":
                        defaultValue = " = 0";
                        break;
                    case "long":
                        defaultValue = " = 0L";
                        break;
                    case "boolean":
                        defaultValue = " = false";
                        break;
                    case "uuid":
                        defaultValue = " = java.util.UUID.randomUUID()";
                        break;
                    case "date":
                        defaultValue = " = java.time.LocalDate.now()";
                        break;
                    case "datetime":
                        defaultValue = " = java.time.LocalDateTime.now()";
                        break;
                    default:
                        defaultValue = " = null";
                        break;
                }
            }
            return `    private ${type} ${variable.name}${defaultValue};`;
        }).join("\n");
    }

    static generateLiveReportVariables(fields, identifier) {
        return fields?.map((variable) => {
            const type = typeMapping(variable.type, variable.cardinality, variable.optional);
            let defaultValue = " = null";
            if (variable.cardinality?.toLowerCase() === "list") {
                defaultValue = " = new java.util.ArrayList<>()";
            } else if (!variable.optional) {
                switch (variable.type?.toLowerCase()) {
                    case "string":
                        defaultValue = " = \"\"";
                        break;
                    case "double":
                        defaultValue = " = 0.0";
                        break;
                    case "int":
                        defaultValue = " = 0";
                        break;
                    case "long":
                        defaultValue = " = 0L";
                        break;
                    case "boolean":
                        defaultValue = " = false";
                        break;
                    case "uuid":
                        defaultValue = " = java.util.UUID.randomUUID()";
                        break;
                    case "date":
                        defaultValue = " = java.time.LocalDate.now()";
                        break;
                    case "datetime":
                        defaultValue = " = java.time.LocalDateTime.now()";
                        break;
                    default:
                        defaultValue = " = null";
                        break;
                }
            }
            const aggregateIdentifierAnnotation = (identifier && variable.name === identifier) ? "@AggregateIdentifier " : "";
            return `    ${aggregateIdentifierAnnotation}private ${type} ${variable.name}${defaultValue};`;
        }).join("\n");
    }

    static generateEntityVariables(slice, fields, identifier) {
        // Ensure at least one field is marked as @Id for JPA
        let idFieldFound = fields?.some(f => f.idAttribute || f.name === "aggregateId");
        
        return fields?.map((variable, index) => {
            const type = typeMapping(variable.type, variable.cardinality, variable.optional);
            let defaultValue = " = null";
            // ... (keep existing defaultValue logic)
            if (variable.cardinality?.toLowerCase() === "list") {
                defaultValue = " = new java.util.ArrayList<>()";
            } else if (!variable.optional) {
                switch (variable.type?.toLowerCase()) {
                    case "string":
                        defaultValue = " = \"\"";
                        break;
                    case "double":
                        defaultValue = " = 0.0";
                        break;
                    case "int":
                        defaultValue = " = 0";
                        break;
                    case "long":
                        defaultValue = " = 0L";
                        break;
                    case "boolean":
                        defaultValue = " = false";
                        break;
                    case "uuid":
                        defaultValue = " = java.util.UUID.randomUUID()";
                        break;
                    case "date":
                        defaultValue = " = java.time.LocalDate.now()";
                        break;
                    case "datetime":
                        defaultValue = " = java.time.LocalDateTime.now()";
                        break;
                    default:
                        defaultValue = " = null";
                        break;
                }
            }

            if (variable.cardinality?.toLowerCase() === "list") {
                return `
                 @jakarta.persistence.ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
                 @jakarta.persistence.CollectionTable(
                    name = "${slice}_${camelCaseToUnderscores(variable.name)}",
                    joinColumns = @jakarta.persistence.JoinColumn(name = "aggregateId")
                 )
                private ${type} ${variable.name}${defaultValue};`;
            } else {
                // Assign @Id if it's the idAttribute, or 'aggregateId' and no other @Id found, or it's the first field and no @Id found.
                let isId = variable.idAttribute || (variable.name === "aggregateId" && !fields.some(f => f.idAttribute)) || (!idFieldFound && index === 0);
                const idAnnotation = isId ? "@jakarta.persistence.Id " : "";
                return `    ${idAnnotation}@jakarta.persistence.Column(name="${slugify(variable.name)}") private ${type} ${variable.name}${defaultValue};`;
            }
        }).join("\n");
    }

    static generateInvocation(fields, source) {
        return fields?.map((variable) => {
            if (source) {
                const getter = `${variable.name}()`;
                return `${source}.${getter}`;
            }
            return `${variable.name}`;
        }).filter((it) => it !== "").join(",\n");
    }

    static generateRestParamInvocation(fields) {
        return fields?.map((variable) => {
            const type = typeMapping(variable.type, variable.cardinality, variable.optional);
            let annotations = "";
            if (variable.type?.toLowerCase() === "date") {
                annotations = `@org.springframework.format.annotation.DateTimeFormat(pattern = "dd.MM.yyyy") `;
            } else if (variable.type?.toLowerCase() === "datetime") {
                annotations = `@org.springframework.format.annotation.DateTimeFormat(pattern = "dd.MM.yyyy HH:mm:ss") `;
            }
            return `${annotations}@org.springframework.web.bind.annotation.RequestParam ${type} ${variable.name}`;
        }).filter((it) => it !== "").join(",\n");
    }
}

const variableAssignments = (targetFields, sourceName, sourceObject, separator = ",\n", targetPrefix = "this.") => {
    return targetFields?.map(targetField => {
        const sourceField = sourceObject.fields?.find(f => f.name === targetField.name || f.name === targetField.mapping);
        if (sourceField) {
            const sourceAccessor = `${sourceName}.${sourceField.name}()`;
            if (targetField.cardinality?.toLowerCase() === "list") {
                // If target is list, and source is not list or is list
                if (sourceField.cardinality?.toLowerCase() !== "list") {
                    // Adding a single element to a list
                    return `${targetPrefix}${targetField.name}.add(${sourceAccessor});`;
                } else {
                    // Assigning a list to a list
                    return `${targetPrefix}${targetField.name}.addAll(${sourceAccessor});`;
                }
            } else {
                // Direct assignment for non-list fields
                return `${targetPrefix}${targetField.name} = ${sourceAccessor};`;
            }
        }
        return `// TODO: Map field '${targetField.name}'`;
    }).filter(it => it).join(separator);
};


const processSourceMapping = (targetField, sourceName, source, assigmentOperator = "=") => {
    var name = targetField.name;
    var field = source.fields?.find((field) => field.name === name);
    if (field) {
        const sourceAccessor = `${sourceName}.${field.name}()`;
        if (targetField.cardinality?.toLowerCase() === "list") {
            if (field.cardinality?.toLowerCase() !== "list") {
                return `this.${targetField.name}.add(${sourceAccessor});`;
            } else {
                return `this.${targetField.name}.addAll(${sourceAccessor});`;
            }
        } else {
            return `this.${targetField.name} = ${sourceAccessor};`;
        }
    }
    var mapping = source.fields?.find((field) => targetField.mapping === field.name);
    if (mapping) {
        const sourceAccessor = `${sourceName}.${targetField.mapping}()`;
        if (targetField.cardinality?.toLowerCase() === "list") {
            if (mapping.cardinality?.toLowerCase() !== "list") {
                return `this.${targetField.name}.add(${sourceAccessor});`;
            } else {
                return `this.${targetField.name}.addAll(${sourceAccessor});`;
            }
        } else {
            return `this.${targetField.name} = ${sourceAccessor};`;
        }
    }
    return `// TODO: Could not map field '${targetField.name}'`;
};

module.exports = { VariablesGenerator, variableAssignments, processSourceMapping };
