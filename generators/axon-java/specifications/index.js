/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
var slugify = require('slugify')
const {v4: uuidv4} = require('uuid');
const {
    _eventTitle,
    _readmodelTitle,
    _commandTitle,
    _aggregateTitle,
    _sliceTitle,
    _packageName,
    _packageFolderName
} = require("../../common/util/naming");
const {lowercaseFirstCharacter, uniqBy, splitByCamelCase, idField, capitalizeFirstCharacter} = require("../../common/util/util");
const {idType, ClassesGenerator, typeMapping, typeImports} = require("../../common/util/generator");



var config = {}

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.givenAnswers = opts.answers
        const configPath = this.destinationPath("config.json");
        if (this.fs.exists(configPath)) {
            config = JSON.parse(this.fs.read(configPath));
        } else {
            config = {};
        }
    }

    writeSpecifications() {
        this._writeSpecifications();
    }

    _writeSpecifications() {
        var slice = this._findSlice(this.givenAnswers.slice)
        var title = _sliceTitle(slice.title).toLowerCase()

        slice.specifications?.filter(it => !it?.vertical).forEach((specification) => {

            var given = specification.given.sort((a, b) => a.index - b.index)
            var when = specification.when?.[0]
            var then = specification.then.sort((a, b) => a.index - b.index)
            var comment = specification?.comments?.map(it => it.description)?.join("\n")

            var allElements = given.concat(when).concat(then).filter(item => item);
            var allFields = allElements.flatMap((item) => item.fields)
            var _elementImports = generateImports(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, title, allElements)
            var _typeImports = typeImports(allFields)
            var aggregateId = uuidv4()
            var defaults = {
                "aggregateId": aggregateId
            }

            var events = given?.map(it => {
                return config.slices.flatMap(it => it.events).find(item => item.id === it.linkedId)
            }).map(it => it);

            var commands = uniqBy(events.flatMap(it => it?.dependencies).filter(it => it?.type === "INBOUND")
                .filter(it => it?.elementType === "COMMAND")
                .map(it => config.slices.flatMap(item => item.commands).find(item => item.id === it.id)).filter(it => it), it => it.title);

            var _commandImports = this._commandImports(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, commands);


            if (slice.processors?.length > 0) {

                let specificationName = _specificationTitle(capitalizeFirstCharacter(slugify(specification.title, "")),)

                var elementImports = generateImports(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, title, then)

                //for now only result events supported
                this.fs.copyTpl(
                    this.templatePath(`src/components/ProcessorSpecification.java.tpl`),
                    this.destinationPath(`./src/test/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/integration/${specificationName}.java`),
                    {
                        _slice: title,
                        _comment: comment,
                        _rootPackageName: this.givenAnswers.rootPackageName,
                        _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                        _name: specificationName,
                        _testname: splitByCamelCase(specificationName),
                        _elementImports: elementImports,
                        _commandImports: _commandImports,
                        _typeImports: _typeImports,
                        _given: this._renderReadModelGiven(commands),
                        _then: this._renderProcessorThen(then),
                        // take first aggregate
                        _aggregate: _aggregateTitle((slice.aggregates || [])[0]),
                        _aggregateId: aggregateId,
                        link: buildLink(config.boardId, specification.id)

                    }
                );
            }

            if (then.some(it => it.type === "SPEC_READMODEL")) {

                let specificationName = _specificationTitle(capitalizeFirstCharacter(slugify(specification.title, "")), "ReadModel")
                var readModel = then.find(it => it.type === "SPEC_READMODEL");

                var _queryImports = this._queryImports(title, this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, _readmodelTitle(readModel.title));

                //for now only result events supported
                this.fs.copyTpl(
                    this.templatePath(`src/components/ReadModelSpecification.java.tpl`),
                    this.destinationPath(`./src/test/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/integration/${specificationName}.java`),
                    {
                        _slice: title,
                        _comment: comment,
                        _rootPackageName: this.givenAnswers.rootPackageName,
                        _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                        _name: specificationName,
                        _testname: slugify(specificationName, "").replaceAll("-", ""),
                        _elementImports: _elementImports,
                        _commandImports: _commandImports,
                        _queryImports: _queryImports,
                        _typeImports: _typeImports,
                        //_when: renderWhen(when, then, defaults),
                        _given: this._renderReadModelGiven(commands),
                        _then: this._renderReadModelThen(commands, then, defaults),
                        // take first aggregate
                        _aggregate: _aggregateTitle((slice.aggregates || [])[0]),
                        _aggregateId: aggregateId,
                        link: buildLink(config.boardId, specification.id)

                    }
                );
            } else if (when) {
                // command test
                let specificationName = _specificationTitle(capitalizeFirstCharacter(slugify(specification.title, "")), "")
                let idAttribute = idField(when)
                let idFieldType = idType(when)

                var idFieldString = `${idFieldType} ${idAttribute} = RandomData.newInstance(${idFieldType}.class);`

                this.fs.copyTpl(
                    this.templatePath(`src/components/Specification.java.tpl`),
                    this.destinationPath(`./src/test/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/${specificationName}.java`),
                    {
                        _idAttribute: idFieldString,
                        _slice: title,
                        _comment: comment,
                        _command: specification.command,
                        _rootPackageName: this.givenAnswers.rootPackageName,
                        _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                        _name: specificationName,
                        _testname: slugify(specificationName, "").replaceAll("-", ""),
                        _elementImports: _elementImports,
                        _typeImports: _typeImports,
                        _given: renderGiven(given, defaults),
                        _when: renderWhen(when, then, defaults),
                        _then: renderThen(when, then, defaults),
                        _thenExpectations: renderThenExpectation(when, then, defaults),
                        // take first aggregate
                        _aggregate: _aggregateTitle((slice.aggregates || [])[0]),
                        _aggregateId: aggregateId,
                        link: buildLink(config.boardId, specification.id)

                    }
                );
            }
        })

    }

    _commandImports(rootPackage, contextPackage, commands) {
        return commands.map(it => `import ${_packageName(rootPackage, contextPackage, false)}.domain.commands.${_sliceTitle(this._findSliceByCommandId(it.id)?.title)}.${_commandTitle(it.title)};`).join("\n")
    }

    _queryImports(slice, rootPackageName, contextPackage, readModel) {
        return `import ${_packageName(rootPackageName, contextPackage, false)}.${slice}.${readModel}Query;
 import ${_packageName(rootPackageName, contextPackage, false)}.${slice}.${readModel};`
    }

    _renderProcessorThen(then) {
        return then?.length > 0 ? `
          awaitUntilAsserted(() -> {
           ${then.map(event => `streamAssertions.assertEvent(commandId.toString(), event -> event instanceof ${_eventTitle(event.title)});
           `).join("\n")
        }
        });
        ` : "";
    }

    _renderReadModelGiven(commands) {

        var idFieldValue = commands.length > 0 ? idField(commands[0]) : "aggregateId";
        var idFieldType = commands.length > 0 ? idType(commands[0]) : "java.util.UUID";

        var commandExecution = commands.map(it => {

            var cmdIdFieldValue = idField(it);
            var cmdIdFieldType = idType(it);

            return `
        
        ${_commandTitle(it.title)} ${lowercaseFirstCharacter(_commandTitle(it.title))} = RandomData.newInstance(${_commandTitle(it.title)}.class, commandInstance -> {
            commandInstance.set${capitalizeFirstCharacter(cmdIdFieldValue)}(${idFieldValue});
        });
       
        commandGateway.sendAndWait(${lowercaseFirstCharacter(_commandTitle(it.title))});
        `;
        }).join("\n");

        return `${idFieldType} ${idFieldValue} = RandomData.newInstance(${idFieldType}.class);
        
        ${commandExecution}
        `;
    }


    _renderReadModelThen(commands, then) {
        var thenReadModel = then ? then[0] : undefined;
        var readModel = config.slices.flatMap((item) => item.readmodels).find((it) => it.id === thenReadModel?.linkedId);

        return then.map(it => `
        awaitUntilAsserted(() -> {
            java.util.concurrent.CompletableFuture<${_readmodelTitle(readModel.title)}> readModelFuture = this._generateQuery(it, commands);
            //TODO add assertions
            ${readModel?.listElement ? "Assertions.assertThat(readModelFuture.get().getData()).isNotEmpty();" : "Assertions.assertThat(readModelFuture.get()).isNotNull();"}
        });
        `).join("\n");
    }

    _generateQuery(readModelSpec, commands) {
        var readModel = config.slices.flatMap((item) => item.readmodels).find((it) => it.id === readModelSpec.linkedId);
        var readModelTitle = _readmodelTitle(readModel.title);
        var readModelIdFields = readModel.fields.filter(it => it.idAttribute).map(it => it.name);

        var commandIdSources = readModelIdFields.reduce((acc, field) => {
            var matchingCommand = commands.find(command =>
                command.fields.some(commandField => commandField.name === field)
            );

            if (matchingCommand) {
                acc.push({
                    name: field,
                    command: matchingCommand
                });
            }

            return acc;
        }, []);


        if (readModel.listElement ?? false) {
            return `queryGateway.query(new ${readModelTitle}Query(), ${readModelTitle}.class)`;
        } else {
            if (readModelIdFields.length <= 0) {
                var idFieldValue = commands.length > 0 ? idField(commands[0]) : "aggregateId";
                return `queryGateway.query(new ${readModelTitle}Query(${idFieldValue}), ${readModelTitle}.class)`;
            } else {
                return `queryGateway.query(new ${readModelTitle}Query(${commandIdSources.map(it => `${lowercaseFirstCharacter(_commandTitle(it.command.title))}.${it.name}()`).join(", ")}), ${readModelTitle}.class)`;
            }
        }
    }


    _findSlice(sliceName) {
        return config.slices.find((item) => item.title === sliceName)
    }

    _findSliceByCommandId(id) {
        return config.slices.filter(it => it.commands.some(item => item.id === id))[0]
    }


};


const generateImports = (rootPackageName, contextPackage, sliceName, elements) => {
    const imports = new Set();
    elements?.forEach((element) => {
        switch (element.type?.toLowerCase()) {
            case "spec_event":
                imports.add(`${_packageName(rootPackageName, null, false)}.events.${_eventTitle(element.title)}`);
                break;
            case "spec_command":
                imports.add(`${_packageName(rootPackageName, contextPackage, false)}.domain.commands.${_sliceTitle(sliceName)}.${_commandTitle(element.title)}`);
                break;
            case "spec_readmodel":
                imports.add(`${_packageName(rootPackageName, contextPackage, false)}.${_sliceTitle(sliceName)}.${_readmodelTitle(element.title)}`);
                break;
            default:
                // console.log("Could not determine imports for element type: " + element.type);
                break;
        }
    });
    return Array.from(imports).map(imp => `import ${imp};`).join("\n");
}


const defaultValue = (type, cardinality = "single", name, defaults) => {
    if (cardinality?.toLowerCase() !== "list" && defaults[name]) {
        return renderVariable(defaults[name], type, name, defaults);
    }
    switch (type.toLowerCase()) {
        case "string":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "\"\"";
        case "boolean":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "false";
        case "double":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "0.0";
        case "long":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "0L";
        case "int":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "0";
        case "uuid":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "java.util.UUID.randomUUID()";
        case "date":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "java.time.LocalDate.now()";
        case "datetime":
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "java.time.LocalDateTime.now()";
        default:
            return cardinality.toLowerCase() === "list" ? "new java.util.ArrayList<>()" : "null";
    }
}


function _specificationTitle(title, postfix) {
    const adjustedTitle = title.replace("Spec:", "").replace("-", "").trim();
    const testName = `${capitalizeFirstCharacter(slugify(adjustedTitle, ""))}${capitalizeFirstCharacter(postfix ?? "")}`;
    return testName.endsWith("Test") ? testName : `${testName}Test`;
}



function renderThenExpectation(whenCommand, thenList, defaults) {
    //in case no error render then
    var thens = thenList.map((item) => {
        if (item.type === "SPEC_EVENT") {
            return `
               expectedEvents.add(new ${_eventTitle(item.title)}(${assertionList(item.fields, whenCommand.fields, defaults)}));
                `
        }
        return "";
    }).join("\n");

    if (thens?.length === 0 && !thenList.some((error) => error.type === "SPEC_ERROR")) {
        return "Assertions.fail(\"No assertion defined in Model. Manual implementation required\");";
    }
    return thens;
}

function renderThen(whenList, thenList, defaults) {

    if (thenList.some((error) => error.type === "SPEC_ERROR")) {
        // in case error render error
        return `.expectException(CommandException.class)`;
    } else {
        return `.expectSuccessfulHandlerExecution()
                .expectEvents(expectedEvents.toArray());`;
    }
}


function renderWhen(whenCommand, thenList, defaults) {
    //only render when if no error occured
    return `final ${_commandTitle(whenCommand.title)} command = new ${_commandTitle(whenCommand.title)}(
 \t\t\t\t${randomizedInvocationParamterList(whenCommand.fields, defaults)}
            );`;
}

function renderGiven(givenList, paramDefaults) {
    var givens = givenList.map((event) => {
        var idFieldValue = idField(event);

        var defaults = idFieldValue ? {...paramDefaults, [idFieldValue]: idFieldValue} : paramDefaults;

        return `events.add(RandomData.newInstance(${_eventTitle(event.title)}.class, eventInstance -> {
                        ${randomizedInvocationParamterList(event.fields, defaults, "\n", "eventInstance")}
                    }));`;
    }).join("\n");

    var given = `
     ${givens}
    `;
    return given;
}

function renderVariable(variableValue, variableType, variableName, defaults) {

    var value = variableValue;
    if (!variableValue && defaults && defaults[variableName]) {
        value = defaults[variableName];
    }
    switch (variableType.toLowerCase()) {
        case "uuid":
            return `java.util.UUID.fromString("${value}")`;
        case "string":
            return `"${value}"`;
        case "date":
            return `java.time.LocalDate.parse("${value}", java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"))`;
        case "datetime":
            return `java.time.LocalDateTime.parse("${value}", java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss"))`;
        case "boolean":
        case "long":
            return `${value}`;
        case "double":
        case "int":
            return `${value}`;
        default:
            return `${value}`; // Fallback, could be null or error
    }
}

function randomizedInvocationParamterList(variables, defaults, separator = ",\n", assignmentPrefix) {

    return variables?.map((variable) => {
            if (variable.example !== "") {
                return `\t${renderVariable(variable.example, variable.type, variable.name, defaults)}`;
            } else if (variable.idAttribute) {
                return `\t${variable.name}`;
            } else {
                if (defaults && Object.keys(defaults).includes(variable.name)) {
                    return `\t${defaultValue(variable.type, variable.cardinality, variable.name, defaults)}`;
                } else {
                    // For Java, we need a class type for newInstance
                    const fieldType = typeMapping(variable.type, variable.cardinality, variable.optional);
                    // Remove generic type if present, e.g., List<String> -> List
                    const baseFieldType = fieldType.indexOf('<') > -1 ? fieldType.substring(0, fieldType.indexOf('<')) : fieldType;
                    // For primitives, we need their wrapper classes for EasyRandom
                    let classLiteral;
                    switch (baseFieldType) {
                        case "int":
                            classLiteral = "Integer.class";
                            break;
                        case "long":
                            classLiteral = "Long.class";
                            break;
                        case "double":
                            classLiteral = "Double.class";
                            break;
                        case "boolean":
                            classLiteral = "Boolean.class";
                            break;
                        default:
                            classLiteral = `${baseFieldType}.class`;
                            break;
                    }
                    return `\tRandomData.newInstance(${classLiteral})`;
                }
            }
        }
    ).join(separator);
}

function assertionList(variables, assignmentValues, defaults) {
    return variables.map((variable) => {
        // if example data provided, take the example into assertion
        if (variable.example !== "") {
            return `${renderVariable(variable.example, variable.type, variable.name, defaults)}`;
            // take the value from the command if available
        } else if (assignmentValues?.some(field => field.name === variable.name)) {
            return `command.${variable.name}()`;
        } else if (variable.example === "" && defaults && defaults[variable.name]) {
            // is there any default? take the default
            return `${renderVariable(defaults[variable.name], variable.type, variable.name, defaults)}`;
        } else {
            return `null /* TODO: manual mapping for ${variable.name} */`;
        }
    }).join(", ");
}