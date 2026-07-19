pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    booleanParam(
      name: 'RUN_DOCKER_COMPOSE_TESTS',
      defaultValue: false,
      description: 'Run Docker Compose health checks with Jenkins credentials.'
    )
  }

  environment {
    BACKEND_IMAGE = "furious-duck-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE = "furious-duck-frontend:${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend - Install') {
      steps {
        dir('backend') {
          sh 'npm ci'
        }
      }
    }

    stage('Backend - Syntax Check') {
      steps {
        dir('backend') {
          sh 'find . -path ./node_modules -prune -o -name "*.js" -print -exec node --check {} \\;'
        }
      }
    }

    stage('Frontend - Install') {
      steps {
        dir('frontend') {
          sh 'npm ci'
        }
      }
    }

    stage('Frontend - Lint') {
      steps {
        dir('frontend') {
          sh 'npm run lint'
        }
      }
    }

    stage('Frontend - Build') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    stage('Docker - Build Images') {
      steps {
        sh 'docker build -t "$BACKEND_IMAGE" ./backend'
        sh 'docker build -t "$FRONTEND_IMAGE" ./frontend'
      }
    }

    stage('Docker Compose - Health Checks') {
      when {
        anyOf {
          branch 'DEV'
          branch 'main'
          expression { return params.RUN_DOCKER_COMPOSE_TESTS }
        }
      }
      environment {
        JWT_EXPIRES_IN = '1d'
      }
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-database-url', variable: 'DATABASE_URL'),
          string(credentialsId: 'furious-duck-jwt-secret', variable: 'JWT_SECRET')
        ]) {
          sh '''
            cat > backend/.env <<EOF
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
EOF

            docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

            for i in $(seq 1 30); do
              if curl -fsS http://localhost:5000/api/health > /dev/null; then
                break
              fi
              sleep 2
            done

            curl -fsS http://localhost:5000/api/health
            curl -fsS http://localhost:5000/api/db/health
          '''
        }
      }
      post {
        always {
          sh 'docker compose -f docker-compose.yml -f docker-compose.dev.yml down || true'
          sh 'rm -f backend/.env'
        }
      }
    }
  }
}
