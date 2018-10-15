node {
    def branchName = (env.CHANGE_BRANCH == null) ? env.BRANCH_NAME : env.CHANGE_BRANCH
    def gitURL = 'https://github.com/Watson-Personal-Assistant/skill-sdk-nodejs.git'
    def skillBoilerPlate = 'Skill-Boilerplate'
    def dependentRepositories = [
        'CI-Test-Skill',
        'Weather-Skill'
    ]

    stage('Get the code') {
        checkout([$class: 'GitSCM', branches: [[name: "${branchName}"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'LocalBranch', localBranch: "**"]], submoduleCfg: [], userRemoteConfigs: [[credentialsId: '15eceab6-eceb-4b2b-b62d-6796f9b63acd', url: "${gitURL}"]]])
    }

    stage('install') {
        sh 'npm install'
    }
    stage('Lint it') {
        // lint here
    }
    stage('npm test') {
        sh 'npm test'
    }


    def parallelStages = [failFast: false]
    dependentRepositories.each {folderName ->
        parallelStages["Build dependent skill - ${folderName}"] = {
            stage("Build dependent skill - ${folderName}") {
                def jobBuild

                // Propagating (propagate: true) will make the step UI ugly, so there is a need to return the build instance and work with it
                try {
                   jobBuild = build job: "${folderName}/${branchName}", parameters: [[$class: 'StringParameterValue', name: 'sdkBuildBranch', value: "${branchName}"]], propagate: false
                } catch (Exception e) {
                   jobBuild = build job: "${folderName}/master", parameters: [[$class: 'StringParameterValue', name: 'sdkBuildBranch', value: "${branchName}"]], propagate: false
                }

                def jobResult = jobBuild.getResult()
                def stageName = jobBuild.getFullDisplayName()

                // Showing the logs of the build job
                echo jobBuild.rawBuild.log

                if (jobResult != 'SUCCESS') {
                   error("${stageName} failed with result: ${jobResult}")
                } else {
                   echo "Build of ${stageName} returned result: ${jobResult}"
                }
            }
        }
    }

    parallel parallelStages
}