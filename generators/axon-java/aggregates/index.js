/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
var slugify = require('slugify')
const {
    _aggregateTitle,
    _packageName,
    _commandTitle,
    _eventTitle,
    _readmodelTitle,
    _sliceTitle
} = require("../../common/util/naming")
const {variableAssignments, processSourceMapping, VariablesGenerator} = require("../../common/util/variables");
const {idField, uniqBy} = require("../../common/util/util");
const {idType, ClassesGenerator, typeMapping, typeImports} = require("../../common/util/generator");
const {analyzeSpecs} = require("../../common/util/specs");
const {fileExistsByGlob} = require("../../common/util/files");


let config = {}


module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.givenAnswers = opts.answers
        config = require(this.env.cwd + "/config.json");
    }


    async prompting() {
        this.answers = await this.prompt([
            {
                type: 'list',
                name: 'aggregate',
                message: 'Which Aggregate should be generated?',
                choices: config?.aggregates?.map((item, idx) => item.title).sort()
            },
            {
                type: 'checkbox',
                name: 'aggregate_slices',
                loop: false,
                message: 'Choose for which Slices to generate Commands- and Eventsourcing Handlers. (generates to .tmp file)',
                choices: (items) => config.slices.filter((slice) => !items.context || items.context?.length === 0 || items.context?.includes(slice.context))
                    .filter(slice => {
                        return slice.commands?.some(command => command.aggregateDependencies?.includes(items.aggregate))
                    })
                    .map((item, idx) => item.title).sort(),
            }]);

    }

    writeAggregates() {
        this._writeAggregates(config.aggregates.find(item => item.title === this.answers.aggregate))
    }

    _writeAggregates(aggregate) {
        var fields = aggregate?.fields?.filter(it => it.name !== "aggregateId").filter(it => !it.idAttribute)
        var idFields = idField(aggregate)
        var idFieldType = idType(aggregate)


        const fileExists = fileExistsByGlob(
            `./src/main/java/${this.givenAnswers.rootPackageName.split(".").join("/")}/domain`,
            `${_aggregateTitle(aggregate.title)}.java`,
            false
        );
        const aggregateFile = fileExists ? `${_aggregateTitle(aggregate.title)}.java.generated` : `${_aggregateTitle(aggregate.title)}.java`

        this.fs.copyTpl(
            this.templatePath(`src/components/Aggregate.java.tpl`),
            this.destinationPath(`./src/main/java/${this.givenAnswers.rootPackageName.split(".").join("/")}/domain/${aggregateFile}`),
            {
                _rootPackageName: this.givenAnswers.rootPackageName,
                _packageName: _packageName(this.givenAnswers.rootPackageName, config?.codeGen?.contextPackage, false),
                _name: _aggregateTitle(aggregate.title),
                _fields: VariablesGenerator.generateVariables(
                    //aggregate Id is rendered anyways. for this case just filter it
                    fields
                ),
                _idField: idFields,
                _idType: idFieldType,
                _typeImports: typeImports(fields),
                _commandHandlers: this._renderCommandHandlers(aggregate),
                _elementImports: this._generateImports(aggregate, this.givenAnswers.rootPackageName, config.codeGen?.contextPackage)

            }
        )
    }

    _renderCommandHandlers(aggregate) {
        const commands = config.slices
            .filter(slice => this.answers.aggregate_slices?.includes(slice.title))
            .flatMap(it => it.commands)
            .filter(it => it.aggregateDependencies?.includes(aggregate.title));

        const handlers = commands.map((command) => {
            const eventDeps = uniqBy(command.dependencies.filter(it => it.type === "OUTBOUND")
                .filter(it => it.elementType === "EVENT").map(item => item.id), (eventId) => eventId);
            const events = uniqBy(config.slices.flatMap(slice => slice.events).filter(item => eventDeps.includes(item.id)), (event) => event.id);

            const slice = config.slices.find(it => it.title === command.slice);
            const specs = slice?.specifications?.map(spec => analyzeSpecs(spec));

            return `
            ${specs.length > 0 ? `/*
//AI-TODO:
        ${specs.join("\n")}
        */` : ``}
    ${command.createsAggregate ? "@CreationPolicy(AggregateCreationPolicy.CREATE_IF_MISSING)" : ""}
        @CommandHandler
        public void handle(${_commandTitle(command.title)} command) {
           ${events.map(event => {
                return `
               AggregateLifecycle.apply(new ${_eventTitle(event.title)}(${variableAssignments(command.fields, "command", event, ",\n")}));
               `;
            }).join("\n")}
        }

        ${events.map(event => `
        @EventSourcingHandler
        public void on(${_eventTitle(event.title)} event){
        // handle event
            ${variableAssignments(aggregate.fields, "event", event, ",\n")}
        }`).join("\n")}
        `;
        });

        return handlers.join("\n");
    }

    _generateImports(aggregate, rootPackageName, contextPackage) {

        var commands = config.slices
            .filter(slice => this.answers.aggregate_slices?.includes(slice.title))
            .flatMap(it => it.commands)
            .filter(it => it.aggregateDependencies?.includes(aggregate.title));

        var events = commands.flatMap(command => command.dependencies.filter(it => it.type === "OUTBOUND")
            .filter(it => it.elementType === "EVENT"))
        var commandImports = commands?.map((command) =>
            `import ${_packageName(rootPackageName, contextPackage, false)}.domain.commands.${_sliceTitle(command.slice)}.${_commandTitle(command.title)}`) ?? []
        var eventImports = events?.map((event) =>
            `import ${_packageName(rootPackageName, null, false)}.events.${_eventTitle(event.title)}`) ?? []

        return commandImports.concat(eventImports).join("\n")
    }
};


