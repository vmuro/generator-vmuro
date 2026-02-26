/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator').default || require('yeoman-generator');
var slugify = require('slugify')
const {answers} = require("../app");
const {
    _eventTitle,
    _commandTitle,
    _processorTitle,
    _readmodelTitle,
    _sliceTitle,
    _slicePackage,
    _aggregateTitle,
    _restResourceTitle,
    _sliceSpecificClassTitle,
    _packageName,
    _packageFolderName
} = require("./../../../generators/common/util/naming");
const {variableAssignments, processSourceMapping, VariablesGenerator} = require("../../common/util/variables");
const {ClassesGenerator, idType, typeMapping, typeImports} = require("../../common/util/generator");
const {camelCaseToUnderscores, idField, capitalizeFirstCharacter} = require("../../common/util/util");
const {analyzeSpecs} = require("../../common/util/specs");
const {buildLink} = require("../../common/util/config");


let config = {}


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

    async prompting() {
        this.answers = await this.prompt([
            {
                type: 'checkbox',
                name: 'slice',
                loop: false,
                message: 'Choose Slices to generate?',
                choices: (items) => (config.slices || []).filter((slice) => !items.context || items.context?.length === 0 || items.context?.includes(slice.context)).map((item, idx) => item.title).sort(),
                when: (answers) => !answers.allSlices && (config.slices || []).length > 0
            },
            {
                type: 'checkbox',
                name: 'liveReportModels',
                message: 'Which ReadModels should read directly from the Eventstream?',
                when: (input) => {
                    return input.slice?.length == 1
                        && (config.slices || []).find((slice) => slice.title === input.slice[0])?.readmodels?.length > 0
                        // for now don´t use list elements for live models, as it´s uncler how to handle ids
                        && !(config.slices || []).find((slice) => slice.title === input.slice[0])?.readmodels[0]?.listElement
                },
                choices: (items) => (config.slices || []).filter((slice) => !items.context || items.context?.length === 0 || items.context?.includes(slice.context)).filter((item) => item.title === items.slice[0]).flatMap((slice) => slice.readmodels).map(item => item.title)
            },
            {
                type: 'checkbox',
                name: 'processTriggers',
                message: 'Which event triggers the Automation?',
                when: (input) => input.slice?.length === 1 && (this._findTriggerEvents(input)?.length > 0),
                choices: (items) => this._findTriggerEvents(items)
            }])

    }

    _findTriggerEvents(items) {
        var slice = (config.slices || []).filter((slice) => !items.context || items.context?.length === 0 || items.context?.includes(slice.context)).filter((item) => item.title === items.slice[0])[0]
        if (!slice) {
            return []
        }

        var processor = slice.processors?.[0]
        if (!processor) {
            return []
        }

        var inboundDepIds = (processor.dependencies || []).filter((dep) => dep.type === "INBOUND" && dep.elementType === "READMODEL").map(it => it.id)

        var readModels = (config.slices || []).flatMap((slice) => slice.readmodels || []).filter((readmodel) => inboundDepIds.includes(readmodel.id))

        var events = readModels.flatMap(it => (it.dependencies || []).filter(dep => dep.type === "INBOUND" && dep.elementType === "EVENT")).map(it => it.title)

        return events
    }

    writeSlice() {

        if (this.answers.slice.length === 0)
            return
        if (this.answers.slice.length > 1) {
            this.answers.slice.forEach(slice => this._writeSingleSlice(slice))
        } else {
            this._writeSingleSlice(this.answers.slice[0])
        }


    }

    _writeSingleSlice(slice) {
        var sliceName = slice
        this._writeReadme(sliceName)
        this._writeSliceDescription(sliceName)
        this._writeCommands(sliceName);
        this._writeEvents(sliceName)
        this._writeReadModels(sliceName)
        this._writeRestControllers(sliceName)
        this.composeWith(require.resolve('../specifications'), {
            answers: {...this.answers, ...this.givenAnswers, slice: sliceName},
            appName: this.answers.appName ?? this.appName
        });
        this._writeProcessors(sliceName)

    }

    _writeSliceDescription(sliceName) {
        var slice = this._findSlice(sliceName)
        this.fs.copyTpl(
            this.templatePath(`.slice.json.tpl`),
            this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${_sliceTitle(sliceName)}/.slice.json`),
            {
                title: sliceName,
                id: slice.id,
                context: slice.context,
                link: buildLink(config.boardId, slice.id)
            }
        )
    }

    _writeReadme(sliceName) {
        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice.title).toLowerCase()


        this.fs.copyTpl(
            this.templatePath(`src/components/README.md.tpl`),
            this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/README.md`),
            {
                _name: slice.title,
                _link: buildLink(config.boardId, slice.id)
            }
        )

    }

    _writeCommands(sliceName) {
        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice.title).toLowerCase()


        slice.commands?.filter((command) => command.title).forEach((command) => {

            this.fs.copyTpl(
                this.templatePath(`src/components/package-info.java.tpl`),
                this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/domain/commands/${title}/package-info.java`),
                {
                    _slice: title,
                    _rootPackageName: this.givenAnswers.rootPackageName,
                    _packageName: _packageName(this.givenAnswers.rootPackageName, config?.codeGen?.contextPackage, false),
                    link: buildLink(config.boardId, command.id)
                }
            )


            this.fs.copyTpl(
                this.templatePath(`src/components/Command.java.tpl`),
                this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config?.codeGen?.contextPackage, false)}/domain/commands/${title}/${_commandTitle(command.title)}.java`),
                {
                    _slice: title,
                    _rootPackageName: this.givenAnswers.rootPackageName,
                    _packageName: _packageName(this.givenAnswers.rootPackageName, config?.codeGen?.contextPackage, false),
                    _name: _commandTitle(command.title),
                    _fields: command.fields?.map((field) => {
                        const idAnnotation = field.idAttribute ? "@TargetAggregateIdentifier " : "";
                        return `${idAnnotation}${typeMapping(field.type, field.cardinality, field.optional)} ${field.name}`;
                    }).join(",\n    "),
                    link: buildLink(config.boardId, command.id),
                    _typeImports: typeImports(command.fields)

                }
            )
        })


    }


    _writeEvents(sliceName, eventFilter = []) {

        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice?.title).toLowerCase()

        slice.events?.filter((event) => event.title)
            .filter((event) => {
                return !eventFilter || eventFilter.length === 0 || eventFilter.includes(event.title)
            })
            .filter(event => event.context !== "EXTERNAL")
            .forEach((event) => {

                            this.fs.copyTpl(
                                this.templatePath(`src/components/Event.java.tpl`),
                                this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, null, false)}/events/${_eventTitle(event.title)}.java`),
                                {
                                    _slice: title,
                                    _rootPackageName: this.givenAnswers.rootPackageName,
                                    _packageName: _packageName(this.givenAnswers.rootPackageName, null, false),
                                    _name: _eventTitle(event.title),
                                    _fields: event.fields?.map((field) => {
                                        return `${typeMapping(field.type, field.cardinality, field.optional)} ${field.name}`;
                                    }).join(",\n    "),
                                    //for now take first aggregate
                                    _typeImports: typeImports(event.fields),
                                    link: buildLink(config.boardId, event.id),
                
                                }
                            )            })


    }


    _writeReadModels(sliceName) {
        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice.title).toLowerCase()

        slice.readmodels?.filter((readmodel) => readmodel.title).forEach((readmodel) => {


            let liveReport = this.answers.liveReportModels?.includes(readmodel.title)

            let sliceEvents = config.slices.flatMap(it => it.events)
            let inboundEvents = readmodel.dependencies?.filter(it => it.type === "INBOUND").filter(it => it.elementType === "EVENT").map(it => sliceEvents.find(sliceEvent => it.id === sliceEvent.id)).filter(it => it)

            let idAttributes = readmodel.fields.filter(it => it.idAttribute)

            if (liveReport) {
                this._writeLiveReportReadModel(title, readmodel, inboundEvents)
            } else {
                if (idAttributes.length <= 1) {
                    this._writeQueryableReportReadModel(title, readmodel, inboundEvents, slice)
                } else {
                    this._writeQueryableMultiKeyReportReadModel(title, readmodel, inboundEvents, slice)
                }
            }

            var eventDeps = readmodel.dependencies.filter(it => it.type === "INBOUND" && it.elementType === "EVENT")
            var events = config.slices.flatMap(slice => slice.events).filter(event => eventDeps.map(it => it.id).includes(event.id))
            events.forEach(event => {
                this._writeEvents(event.slice, [event.title])
            })
        })

    }

    _repositoryQuery(readModel) {
        const fields = readModel.fields;
        const idFieldFound = fields?.some(f => f.idAttribute || f.name === "aggregateId");
        
        let idField;
        if (fields && fields.length > 0) {
            idField = fields.find(f => f.idAttribute);
            if (!idField) {
                idField = fields.find(f => f.name === "aggregateId");
            }
            if (!idField && !idFieldFound) {
                idField = fields[0];
            }
        }
        var idFieldName = idField?.name ?? "aggregateId";

        if (readModel.listElement ?? false) {
            return `return new ${_readmodelTitle(readModel.title)}(repository.findAll());`;
        } else {
            return `
            if(!repository.existsById(query.${idFieldName}())) {
                return null;
            }
            return new ${_readmodelTitle(readModel.title)}(repository.findById(query.${idFieldName}()).get());`;
        }
    }

    _writeLiveReportReadModel(slice, readmodel, inboundEvents) {
        const fields = readmodel.fields;
        const idFieldFound = fields?.some(f => f.idAttribute || f.name === "aggregateId");
        
        let idFieldObj;
        if (fields && fields.length > 0) {
            idFieldObj = fields.find(f => f.idAttribute);
            if (!idFieldObj) {
                idFieldObj = fields.find(f => f.name === "aggregateId");
            }
            if (!idFieldObj && !idFieldFound) {
                idFieldObj = fields[0];
            }
        }
        const idAttribute = idFieldObj?.name ?? "aggregateId";
        const idTypeVar = idType(readmodel)
        const destFolder = `./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${slice}`;
        const readModelTitle = _readmodelTitle(readmodel.title);

        if (readmodel.listElement) {

            this.fs.copyTpl(
                this.templatePath(`src/components/LiveReportListReadModel.java.tpl`),
                this.destinationPath(`${destFolder}/${readModelTitle}.java`),
                {
                    _slice: slice,
                    _rootPackageName: this.givenAnswers.rootPackageName,
                    _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                    _name: readModelTitle,
                    _fields: ClassesGenerator.generateRecordFields(
                        readmodel.fields
                    ),
                    _eventsImports: this._eventsImports(inboundEvents.map(it => it.title)),

                    _eventLoop: this._renderReadModelSwitchCaseJava ? this._renderReadModelSwitchCaseJava(readmodel, inboundEvents) : "",

                    _typeImports: typeImports(readmodel.fields),
                    link: buildLink(config.boardId, readmodel.id),
                    idAttribute: idAttribute,
                    idType: idTypeVar
                }
            )
        } else {

            this.fs.copyTpl(
                this.templatePath(`src/components/LiveReportReadModel.java.tpl`),
                this.destinationPath(`${destFolder}/${readModelTitle}.java`),
                {
                    _slice: slice,
                    _rootPackageName: this.givenAnswers.rootPackageName,
                    _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                    _name: readModelTitle,
                    _fields: VariablesGenerator.generateLiveReportVariables(
                        readmodel.fields,
                        idAttribute
                    ),
                    _eventsImports: this._eventsImports(inboundEvents.map(it => it.title)),

                    _eventLoop: this._renderReadModelSwitchCaseJava ? this._renderReadModelSwitchCaseJava(readmodel, inboundEvents) : "",

                    _typeImports: typeImports(readmodel.fields),
                    link: buildLink(config.boardId, readmodel.id),
                    idAttribute: idAttribute,
                    idType: idTypeVar
                }
            )
        }

        // Write Query record
        this.fs.write(
            this.destinationPath(`${destFolder}/${readModelTitle}Query.java`),
            `package ${_packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}.${slice};\n\n` +
            `import com.example.common.Query;\n` +
            `${typeImports(readmodel.fields)}\n\n` +
            `public record ${readModelTitle}Query(${idTypeVar} ${idAttribute}) implements Query {}`
        );

        this.fs.copyTpl(
            this.templatePath(`src/components/LiveReportQueryHandler.java.tpl`),
            this.destinationPath(`${destFolder}/internal/${readModelTitle}QueryHandler.java`),
            {
                _slice: slice,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _typeImports: typeImports(readmodel.fields),
                link: buildLink(config.boardId, readmodel.id),
                idAttribute: idAttribute,
                idType: idTypeVar
            }
        )

        this.fs.copyTpl(
            this.templatePath(`src/components/ReadOnlyRestResource.java.tpl`),
            this.destinationPath(`${destFolder}/internal/ReadOnly${_restResourceTitle(readmodel.title)}.java`),
            {
                _slice: slice,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: slice,
                _readModel: readModelTitle,
                _controller: `ReadOnly${_restResourceTitle(readmodel.title)}`,
                _typeImports: typeImports(readmodel.fields),
                _endpoint: this._generateGetRestCall(slice, VariablesGenerator.generateRestParamInvocation(
                    readmodel.fields
                ), readmodel, readmodel.apiEndpoint),
                link: buildLink(config.boardId, readmodel.id),
                idAttribute: idAttribute,
                idType: idTypeVar
            }
        )
    }

    _readModelQueryElement(readModel) {
        const fields = readModel.fields;
        const idFieldFound = fields?.some(f => f.idAttribute || f.name === "aggregateId");
        
        let idField;
        if (fields && fields.length > 0) {
            idField = fields.find(f => f.idAttribute);
            if (!idField) {
                idField = fields.find(f => f.name === "aggregateId");
            }
            if (!idField && !idFieldFound) {
                idField = fields[0];
            }
        }

        var idFieldName = idField?.name ?? "aggregateId";
        var idTypeStr = idField ? typeMapping(idField.type, idField.cardinality, false) : "java.util.UUID";

        if (readModel.listElement ?? false) {
            return `public record ${_readmodelTitle(readModel.title)}Query() {}`;
        } else {
            return `public record ${_readmodelTitle(readModel.title)}Query(${idTypeStr} ${idFieldName}) {}`;
        }
    }

    _writeQueryableMultiKeyReportReadModel(sliceTitle, readModel, inboundEvents, slice) {

        var specs = slice?.specifications?.map(spec => analyzeSpecs(spec))
        var aiComment = specs?.length > 0 ? `/*
         // AI-TODO:
         ${specs.join(`\n`)} */` : ""

        const destFolder = `./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${sliceTitle}`;
        const readModelTitle = _readmodelTitle(readModel.title);

        // Write ReadModel record
        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableMultiKeyReadModel.java.tpl`),
            this.destinationPath(`${destFolder}/${readModelTitle}.java`),
            {
                _slice: sliceTitle,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _data: this._readModelData(readModel),
                _typeImports: typeImports(readModel.fields),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        // Write Key record
        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableMultiKeyReadModelKey.java.tpl`),
            this.destinationPath(`${destFolder}/${readModelTitle}Key.java`),
            {
                _slice: sliceTitle,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _annotatedKeyFields: this._keyFields(readModel, true),
                _typeImports: typeImports(readModel.fields),
            }
        )

        // Write Entity class
        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableMultiKeyReadModelEntity.java.tpl`),
            this.destinationPath(`${destFolder}/${readModelTitle}Entity.java`),
            {
                _slice: sliceTitle,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _entityFields: VariablesGenerator.generateEntityVariables(
                    sliceTitle,
                    readModel.fields,
                    readModel?.fields.find(it => it?.idAttribute).name ?? "aggregateId"
                ),
                _typeImports: typeImports(readModel.fields),
            }
        )

        // Write Query record
        this.fs.write(
            this.destinationPath(`${destFolder}/${readModelTitle}Query.java`),
            `package ${_packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}.${sliceTitle};\n\n` +
            `import java.util.UUID;\n` +
            `${typeImports(readModel.fields)}\n\n` +
            `public record ${readModelTitle}Query(${this._keyFields(readModel, false)}) {}`
        );

        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableMultiKeyReadModelProjector.java.tpl`),
            this.destinationPath(`${destFolder}/internal/${readModelTitle}Projector.java`),
            {
                _slice: sliceTitle,
                _aiComment: aiComment,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _fields: VariablesGenerator.generateVariables(
                    readModel.fields
                ),
                _eventsImports: this._eventsImports(inboundEvents.map(it => it?.title)),
                _eventHandlers: this._renderMultiKeyEventHandlersJava(readModel, inboundEvents),

                //no UUID, as this is fixed in the Projector
                _typeImports: typeImports(readModel.fields, ["java.util.UUID"]),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableMultiKeyReadModelQueryHandler.java.tpl`),
            this.destinationPath(`${destFolder}/internal/${readModelTitle}QueryHandler.java`),
            {
                _slice: sliceTitle,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _query: this._repositoryQuery(readModel),
                _typeImports: typeImports(readModel.fields),
                _fields: VariablesGenerator.generateInvocation(readModel.fields.filter(it => it.idAttribute), "query"),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        this.fs.copyTpl(
            this.templatePath(`src/components/ReadOnlyRestResource.java.tpl`),
            this.destinationPath(`${destFolder}/internal/ReadOnly${_restResourceTitle(readModel.title)}.java`),
            {
                _slice: sliceTitle,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: sliceTitle,
                _readModel: readModelTitle,
                _controller: `ReadOnly${_restResourceTitle(readModel.title)}`,
                _typeImports: typeImports(readModel.fields),
                _endpoint: this._generateGetRestCall(sliceTitle, VariablesGenerator.generateRestParamInvocation(
                    readModel.fields
                ), readModel, readModel.apiEndpoint),
                link: buildLink(config.boardId, readModel.id),
            }
        )
    }

    _keyFields(readModel) {
        return readModel.fields?.filter(it => it.idAttribute).map(field => {
            return `${typeMapping(field.type, field.cardinality, field.optional)} ${field.name}`;
        }).join(", ");
    }

    _writeQueryableReportReadModel(sliceTitle, readModel, inboundEvents, slice) {

        var specs = slice?.specifications?.map(spec => analyzeSpecs(spec))
        var aiComment = specs?.length > 0 ? `/* 
        // AI-TODO:
        ${specs.join(`\n`)} */` : ""

        const destFolder = `./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${sliceTitle}`;
        const readModelTitle = _readmodelTitle(readModel.title);

        // Write ReadModel record
        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableReadModel.java.tpl`),
            this.destinationPath(`${destFolder}/${readModelTitle}.java`),
            {
                _slice: sliceTitle,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _data: this._readModelData(readModel),
                _typeImports: typeImports(readModel.fields),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        // Write Entity class
        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableReadModelEntity.java.tpl`),
            this.destinationPath(`${destFolder}/${readModelTitle}Entity.java`),
            {
                _slice: sliceTitle,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _entityFields: VariablesGenerator.generateEntityVariables(
                    sliceTitle,
                    readModel.fields,
                    readModel.fields?.find(it => it.idAttribute)?.name ?? "aggregateId"
                ),
                _typeImports: typeImports(readModel.fields),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        // Write Query record
        this.fs.write(
            this.destinationPath(`${destFolder}/${readModelTitle}Query.java`),
            `package ${_packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}.${sliceTitle};\n\n` +
            `import java.util.UUID;\n` +
            `${typeImports(readModel.fields)}\n\n` +
            this._readModelQueryElement(readModel)
        );

        this.fs.copyTpl(
            this.templatePath(`src/components/QueryableReadModelProjector.java.tpl`),
            this.destinationPath(`${destFolder}/internal/${readModelTitle}Projector.java`),
            {
                _slice: sliceTitle,
                _aiComment: aiComment,
                _idType: idType(readModel),
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: readModelTitle,
                _fields: VariablesGenerator.generateVariables(
                    readModel.fields
                ),
                _eventsImports: this._eventsImports(inboundEvents.map(it => it?.title)),
                _eventHandlers: this._renderEventHandlersJava(readModel, inboundEvents),

                //no UUID, as this is fixed in the Projector
                _typeImports: typeImports(readModel.fields, ["java.util.UUID"]),
                link: buildLink(config.boardId, readModel.id),
            }
        )

        this.fs.copyTpl(
            this.templatePath(`src/components/ReadOnlyRestResource.java.tpl`),
            this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${sliceTitle}/internal/ReadOnly${_restResourceTitle(readModel.title)}.java`),
            {
                _slice: sliceTitle,
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                _name: sliceTitle,
                _readModel: readModelTitle,
                _controller: `ReadOnly${_restResourceTitle(readModel.title)}`,
                _typeImports: typeImports(readModel.fields),
                _endpoint: this._generateGetRestCall(sliceTitle, VariablesGenerator.generateRestParamInvocation(
                    readModel.fields
                ), readModel, readModel.apiEndpoint),
                link: buildLink(config.boardId, readModel.id),
            }
        )
    }

    _renderMultiKeyEventHandlersJava(readModel, events) {
        var readModelTitle = _readmodelTitle(readModel.title);
        var readModelIdFields = readModel.fields.filter(it => it.idAttribute);
        return events.map(it => {
            const keyInvocation = readModelIdFields.map(idField => {
                const eventField = it.fields?.find(f => f.name === idField.name || f.idAttribute);
                let val = `event.${eventField ? eventField.name : idField.name}()`;
                
                const targetType = typeMapping(idField.type, idField.cardinality, false);
                const sourceType = eventField ? typeMapping(eventField.type, eventField.cardinality, false) : "String";
                
                if (targetType.includes("UUID") && sourceType.includes("String")) {
                    return `java.util.UUID.fromString(${val})`;
                } else if (targetType.includes("String") && sourceType.includes("UUID")) {
                    return `${val}.toString()`;
                }
                return val;
            }).join(", ");

            return `
@EventHandler
public void on(${_eventTitle(it.title)} event) {
    //throws exception if not available (adjust logic)
    ${readModelTitle}Key key = new ${readModelTitle}Key(${keyInvocation});
    ${readModelTitle}Entity entity = this.repository.findById(key).orElse(new ${_readmodelTitle(readModel.title)}Entity());
    ${variableAssignments(readModel.fields, "event", it, "\n", "entity.set", "()")}
    this.repository.save(entity);
}`
        }).join("\n");
    }

    _renderEventHandlersJava(readModel, events) {
        return events.map(it => {
            const id = idField(readModel);
            const expectedIdType = idType(readModel);
            
            // Try to find the same ID field in the event, or fallback to any idAttribute, aggregateId, or productId in the event.
            let eventField = it.fields?.find(f => f.name === id)
                || it.fields?.find(f => f.idAttribute)
                || it.fields?.find(f => f.name === "aggregateId")
                || it.fields?.find(f => f.name === "productId")
                || (it.fields?.length > 0 ? it.fields[0] : null);

            let eventIdField = eventField ? eventField.name : "aggregateId";
            let eventIdType = eventField ? typeMapping(eventField.type, eventField.cardinality, false) : "java.util.UUID";
            
            let idValue = `event.${eventIdField}()`;
            if (expectedIdType.includes("UUID") && eventIdType.includes("String")) {
                idValue = `java.util.UUID.fromString(${idValue})`;
            } else if (expectedIdType.includes("String") && eventIdType.includes("UUID")) {
                idValue = `${idValue}.toString()`;
            }

            return `
@EventHandler
public void on(${_eventTitle(it.title)} event) {
    //throws exception if not available (adjust logic)
    ${_readmodelTitle(readModel.title)}Entity entity = this.repository.findById(${idValue}).orElse(new ${_readmodelTitle(readModel.title)}Entity());
    ${variableAssignments(readModel.fields, "event", it, "\n", "entity.set", "()")}
    this.repository.save(entity);
}`
        }).join("\n");
    }

    _writeRestControllers(sliceName) {
        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice.title).toLowerCase()


        slice.commands?.filter((command) => command.title).forEach((command) => {
            this.fs.copyTpl(
                this.templatePath(`src/components/RestResource.java.tpl`),
                this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/internal/${_restResourceTitle(command.title)}.java`),
                {
                    _slice: title,
                    _rootPackageName: this.givenAnswers.rootPackageName,
                    _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                    _name: title,
                    _command: _commandTitle(command.title),
                    _controller: _restResourceTitle(command.title),
                    _typeImports: typeImports(command.fields),
                    _debugendpoint: this._generateDebugPostRestCall(title, VariablesGenerator.generateRestParamInvocation(
                        command.fields
                    ), _commandTitle(command.title), VariablesGenerator.generateInvocation(
                        command.fields
                    ), command.apiEndpoint),
                    _payload: `record ${_sliceSpecificClassTitle(sliceName, "Payload")}(${ClassesGenerator.generateRecordFields(command.fields, ",\n")}) {}`,
                    _endpoint: this._generatePostRestCall(slice.title, command,
                        VariablesGenerator.generateInvocation(command.fields, "payload"), command.apiEndpoint),
                    link: buildLink(config.boardId, command.id),
                }
            )
        })

    }

    _readModelData(readModel) {
        if (readModel?.listElement) {
            return `java.util.List<${_readmodelTitle(readModel.title)}Entity> data`;
        } else {
            return `${_readmodelTitle(readModel.title)}Entity data`;
        }
    }

    _generateDebugPostRestCall(slice, restVariables, command, variables, endpoint) {
        return `
    @CrossOrigin
    @PostMapping(${endpoint ? `\"/debug${endpoint?.startsWith("/") ? endpoint : "/" + endpoint}\"` : `\"/debug/${slice}\"`})
    public java.util.concurrent.CompletableFuture<Object> processDebugCommand(${restVariables}) {
        return commandGateway.send(new ${command}(${variables}));
    }
    `;
    }

    _generatePostRestCall(slice, command, variableAssignments, endpoint) {
        let commandTitle = _commandTitle(command.title);
        return `
       @CrossOrigin
       @PostMapping(${endpoint ? `"${endpoint}/{id}"`
            : `"/${_sliceTitle(slice)}/{id}"`})
    public java.util.concurrent.CompletableFuture<Object> processCommand(
        @PathVariable("id") ${idType(command)} id,
        @RequestBody ${_sliceSpecificClassTitle(slice, "Payload")} payload
    ) {
         return commandGateway.send(new ${commandTitle}(${variableAssignments}));
        }
       `;
    }

    _generateQuery(slice, readModel) {
        var readModelTitle = _readmodelTitle(readModel.title);
        var idAttributes = readModel.fields?.filter(it => it.idAttribute);

        if (readModel.listElement ?? false) {
            return `queryGateway.query(new ${readModelTitle}Query(), ${readModelTitle}.class)`;
        } else {
            if (idAttributes.length <= 1) {
                return `queryGateway.query(new ${readModelTitle}Query(${idField(readModel)}), ${readModelTitle}.class)`;
            } else {
                return `queryGateway.query(new ${readModelTitle}Query(${VariablesGenerator.generateInvocation(idAttributes)}), ${readModelTitle}.class)`;
            }
        }
    }

    _generateGetRestCall(slice, restVariables, readModel, endpoint) {
        var readModelTitle = _readmodelTitle(readModel.title);
        var readModelIdAttributes = readModel.fields.filter(it => it.idAttribute);
        if (readModel.listElement) {
            return `@GetMapping(${endpoint ? `"${endpoint}"` : `"/${slice}"`})
                    public java.util.concurrent.CompletableFuture<${readModelTitle}> findReadModel() {
                         return ${this._generateQuery(slice, readModel)};
                    }`;
        } else {
            if (readModelIdAttributes.length <= 1) {
                return `@GetMapping(${endpoint ? `"${endpoint}/{id}"` : `"/${slice}/{id}"`})
                      public java.util.concurrent.CompletableFuture<${readModelTitle}> findReadModel(@PathVariable("id") ${idType(readModel)} ${idField(readModel)}) {
                           return ${this._generateQuery(slice, readModel)};
                      }`;
            } else {
                var idAttributes = readModelIdAttributes.filter(it => it.name !== "aggregateId");
                var requestParams = idAttributes.map(it => `@RequestParam("${it.name}") ${typeMapping(it.type, it.cardinality, it.optional)} ${it.name}`).join(",\n");
                return `@GetMapping(${endpoint ? `"${endpoint}"` : `"/${slice}"`})
                      public java.util.concurrent.CompletableFuture<${readModelTitle}> findReadModel(${requestParams}) {
                           return ${this._generateQuery(slice, readModel)};
                      }`;
            }
        }
    }


    _writeProcessors(sliceName) {
        var slice = this._findSlice(sliceName)
        var title = _slicePackage(slice.title).toLowerCase()
        var command = slice.commands.length > 0 ? slice.commands[0] : null

        slice.processors?.filter((processor) => processor.title).forEach((processor) => {

            var readModelDependency = processor?.dependencies?.filter((it) => it.type === "INBOUND" && it.elementType === "READMODEL")[0]

            var readModel = config.slices.flatMap(it => it.readmodels).find(it => it.id === readModelDependency?.id)


            var eventsDeps = readModel?.dependencies?.filter((it) => it.type === "INBOUND" && it.elementType === "EVENT").map(it => it.id) ?? [];

            var events = config.slices.flatMap(it => it.events).filter(it => eventsDeps.includes(it?.id));

            if (readModel) {
                this.fs.copyTpl(
                    this.templatePath(`src/components/StatelessProcessor.java.tpl`),
                    this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/internal/${_processorTitle(processor.title)}.java`),
                    {
                        _slice: title,
                        _readModelSlice: _sliceTitle(readModel.slice),
                        _readModel: _readmodelTitle(readModel.title),
                        _typeImports: typeImports(readModel.fields),
                        _rootPackageName: this.givenAnswers.rootPackageName,
                        _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                        _name: _processorTitle(processor.title),
                        _eventsImports: this._eventsImports(this.answers.processTriggers),
                        _fields: VariablesGenerator.generateVariables(
                            readModel.fields
                        ),
                        _triggers: this._renderStatelessProcessorTriggers(readModel, this.answers.processTriggers || [], events, command),
                        _command: command ? _commandTitle(command.title) : "",
                        link: buildLink(config.boardId, processor.id),

                    })
            } else {
                this.fs.copyTpl(
                    this.templatePath(`src/components/StatelessStandaloneProcessor.java.tpl`),
                    this.destinationPath(`./src/main/java/${_packageFolderName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false)}/${title}/internal/${_processorTitle(processor.title)}.java`),
                    {
                        _slice: title,
                        _rootPackageName: this.givenAnswers.rootPackageName,
                        _packageName: _packageName(this.givenAnswers.rootPackageName, config.codeGen?.contextPackage, false),
                        _name: _processorTitle(processor.title),
                        _eventsImports: this._eventsImports(this.answers.processTriggers),
                        _triggers: this._renderStatelessProcessorTriggers(readModel, this.answers.processTriggers || [], events, command),
                        _command: command ? _commandTitle(command.title) : "",
                        link: buildLink(config.boardId, processor.id),

                    })
            }
        })


    }

    _eventsImports(triggers) {
        return triggers?.map((trigger) => {
            return `import ${this.givenAnswers.rootPackageName}.events.${_eventTitle(trigger)};`
        }).join("\n")
    }

    _renderStatelessProcessorTriggers(readModel, triggers, events, command) {
        return triggers.map((event) => {

            return readModel ? `
                @EventHandler
                public void on(${_eventTitle(event)} event) {
                     queryGateway.query(
            new ${_readmodelTitle(readModel.title)}Query(${!readModel?.listElement ? "event.aggregateId()" : ""}),
            ${_readmodelTitle(readModel.title)}.class
        ).thenAccept(it -> {
                /*commandGateway.send(
                    new ${_commandTitle(command.title)}(
                      ${VariablesGenerator.generateInvocation(command.fields, "it")})
                );*/
        });
                }` : `@EventHandler
            public void on(${_eventTitle(event)} event) {
                    /*commandGateway.send(
                        new ${_commandTitle(command.title)}()
                    );*/
                }
            `;
        }).join("\n");
    }

    _findSlice(sliceName) {
        return config.slices.find((item) => item.title === sliceName)
    }

};
