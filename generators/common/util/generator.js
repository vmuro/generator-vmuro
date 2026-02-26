/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

const { _sliceTitle, _commandTitle, _eventTitle, _readmodelTitle } = require("./naming");

class ClassesGenerator {
    static generateRecord(name, fields) {
        return `public record ${name}(${ClassesGenerator.generateRecordFields(fields, ",\n")}) {}`;
    }

    static generateRecordFields(fields, separator = ",\n") {
        return fields?.map((variable) => {
            const type = typeMapping(variable.type, variable.cardinality, false);
            let annotations = '';
            if (variable.type?.toLowerCase() === "date") {
                annotations = `@com.fasterxml.jackson.annotation.JsonFormat(pattern = "dd.MM.yyyy") `;
            } else if (variable.type?.toLowerCase() === "datetime") {
                annotations = `@com.fasterxml.jackson.annotation.JsonFormat(pattern = "dd.MM.yyyy HH:mm:ss") `;
            }
            return `${annotations}${type} ${variable.name}`;
        }).join(separator);
    }

    // This is for generating fields with initial values for regular classes (not records)
    static generateClassFields(fields, separator = "\n") {
        return fields?.map((variable) => {
            const type = typeMapping(variable.type, variable.cardinality, false);
            let defaultValue = "";
            if (variable.cardinality?.toLowerCase() === "list") {
                defaultValue = " = new java.util.ArrayList<>()";
            } else if (!variable.optional) {
                // For non-optional fields, provide a default that matches Java's implicit initialization or is explicit
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
                        defaultValue = " = null"; // For objects, null is often the default
                        break;
                }
            } else {
                 defaultValue = " = null";
            }

            return `    private ${type} ${variable.name}${defaultValue};`;
        }).join(separator);
    }
}

function idType(element) {
    const idField = element.fields?.find(it => it.idAttribute);
    return idField ? typeMapping(idField.type, idField.cardinality, false) : "java.util.UUID";
}

const typeMapping = (fieldType, fieldCardinality, optional) => {
    let javaType;
    switch (fieldType?.toLowerCase()) {
        case "string":
            javaType = "String";
            break;
        case "double":
            javaType = "Double";
            break;
        case "int":
            javaType = "Integer";
            break;
        case "long":
            javaType = "Long";
            break;
        case "boolean":
            javaType = "Boolean";
            break;
        case "date":
            javaType = "java.time.LocalDate";
            break;
        case "datetime":
            javaType = "java.time.LocalDateTime";
            break;
        case "uuid":
            javaType = "java.util.UUID";
            break;
        default:
            javaType = "String";
            break;
    }
    if (fieldCardinality?.toLowerCase() === "list") {
        return `java.util.List<${javaType}>`;
    } else {
        return javaType;
    }
};

const typeImports = (fields, additionalImports = []) => {
    if (!fields || fields.length === 0) {
        return additionalImports.length > 0 ? `import ${additionalImports.join(";\nimport ")};` : "";
    }
    const imports = new Set(additionalImports);
    fields.forEach((field) => {
        switch (field.type?.toLowerCase()) {
            case "date":
                imports.add("java.time.LocalDate");
                imports.add("org.springframework.format.annotation.DateTimeFormat");
                imports.add("com.fasterxml.jackson.annotation.JsonFormat");
                break;
            case "datetime":
                imports.add("java.time.LocalDateTime");
                imports.add("org.springframework.format.annotation.DateTimeFormat");
                imports.add("com.fasterxml.jackson.annotation.JsonFormat");
                break;
            case "uuid":
                imports.add("java.util.UUID");
                break;
        }
        if (field.cardinality?.toLowerCase() === "list") {
            imports.add("java.util.List");
            imports.add("java.util.ArrayList"); // For default initialization
        }
    });

    return imports.size > 0 ? `import ${Array.from(imports).join(";\nimport ")};` : "";
};

module.exports = { ClassesGenerator, typeMapping, typeImports, idType };
