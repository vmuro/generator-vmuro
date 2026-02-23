/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
var slugify = require('slugify')


let config = {}

module.exports = class extends Generator {

    defaultAppName = "app"

    constructor(args, opts) {
        super(args, opts);
        this.argument('appname', {type: String, required: false});
        const configPath = this.destinationPath("config.json");
        if (this.fs.exists(configPath)) {
            config = JSON.parse(this.fs.read(configPath));
        } else {
            config = {};
        }
    }

    // Async Await
    async prompting() {
        const hasSlices = config && config.slices && config.slices.length > 0;
        const hasAggregates = config && config.aggregates && config.aggregates.length > 0;

        this.answers = await this.prompt([{
            type: 'input',
            name: 'appName',
            message: 'Projectame?',
            when: () => !config?.codeGen?.application,
        }, {
            type: 'input',
            name: 'rootPackageName',
            message: 'Root Package?',
            when: () => !config?.codeGen?.rootPackage,
        },
            {
                type: 'list',
                name: 'generatorType',
                message: 'What should be generated?',
                choices: [
                    { name: 'Skeleton (Use this for new projects)', value: 'Skeleton' },
                    { name: `Slices (${hasSlices ? config.slices.length : 0} found)`, value: 'slices', disabled: !hasSlices },
                    { name: `Aggregates (${hasAggregates ? config.aggregates.length : 0} found)`, value: 'aggregates', disabled: !hasAggregates }
                ]
            }]);
    }

    setDefaults() {
        if (!this.answers.appName) {
            this.answers.appName = config?.codeGen?.application ?? this.defaultAppName
        }
        if (!this.answers.rootPackageName) {
            this.answers.rootPackageName = config?.codeGen?.rootPackage
        }
    }

    writing() {

        if (this.answers.generatorType === 'Skeleton') {
            this._writeSkeleton();
        } else if (this.answers.generatorType === 'slices') {
            this.log('starting commands generation')
            this.composeWith(require.resolve('../slices'), {
                answers: this.answers,
                appName: this.answers.appName ?? this.appName
            });
        } else if (this.answers.generatorType === 'aggregates') {
            this.log('starting aggregates generation')
            this.composeWith(require.resolve('../aggregates'), {
                answers: this.answers,
                appName: this.answers.appName ?? this.appName
            });
        }
    }

    _writeSkeleton() {
        const path = require('path');
        const glob = require('glob');

        const copyTpl = (sourceDir, destDir, data) => {
            const templateRoot = this.templatePath(sourceDir);
            const files = glob.sync('**/*', { cwd: templateRoot, nodir: true, dot: true });
            
            files.forEach(file => {
                const destFile = file.replace(/\.tpl$/, '');
                this.fs.copyTpl(
                    this.templatePath(path.join(sourceDir, file)),
                    this.destinationPath(path.join(destDir, destFile)),
                    data
                );
            });
        };

        // Write Root files (pom, mvnw, etc)
        copyTpl('root', '.', {
            rootPackageName: this.answers.rootPackageName,
            appName: this.answers.appName !== "." ? slugify(this.answers.appName) : "app",
        });

        // Write Java Source files
        copyTpl('src', `./src/main/java/${this.answers.rootPackageName.split(".").join("/")}`, {
            rootPackageName: this.answers.rootPackageName
        });

        // Write Java Test files
        copyTpl('test', `./src/test/java/${this.answers.rootPackageName.split(".").join("/")}`, {
            rootPackageName: this.answers.rootPackageName
        });

        // Write Gitignore
        this.fs.copyTpl(
            this.templatePath('git/gitignore'),
            this.destinationPath(`./.gitignore`),
            {
                rootPackageName: this.answers.rootPackageName
            }
        );
    }

    end() {
    }
};
