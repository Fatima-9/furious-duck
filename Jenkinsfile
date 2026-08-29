pipeline {
  agent any

  tools {
    nodejs 'Node 22'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    BACKEND_IMAGE = "furious-duck-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE = "furious-duck-frontend:${BUILD_NUMBER}"
    JWT_EXPIRES_IN = '1d'
    RESET_TOKEN_EXPIRES_IN_MINUTES = '60'
    DEFAULT_USER_ROLE_ID = '1'
    DEFAULT_BOUTIQUE_ID = '1'
    DOCKER_IMAGE_BACKUP_DIR = "${WORKSPACE}/docker-image-backups/${BUILD_NUMBER}"
    CI_COMPOSE_PROJECT_NAME = "furious-duck-ci-${BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare Pipeline Rules') {
      steps {
        script {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH?.replace('origin/', '')

          if (branch == 'main' || branch == 'PROD') {
            env.COVERAGE_MIN = '100'
            env.DEPLOY_ENV = 'prod'
            env.APP_URL = 'https://dsp5-archi-o24a-g2.fr'
            env.COMPOSE_PROJECT_NAME = 'furious-duck-prod-live'
          } else if (branch == 'PREPROD') {
            env.COVERAGE_MIN = '80'
            env.DEPLOY_ENV = 'preprod'
            env.APP_URL = 'https://preprod.dsp5-archi-o24a-g2.fr'
            env.COMPOSE_PROJECT_NAME = 'furious-duck-preprod-live'
          } else {
            env.COVERAGE_MIN = '60'
            env.DEPLOY_ENV = 'dev'
            env.APP_URL = 'https://dev.dsp5-archi-o24a-g2.fr'
            env.COMPOSE_PROJECT_NAME = 'furious-duck-dev-live'
          }

          echo "Branch: ${branch}"
          echo "Deploy environment: ${env.DEPLOY_ENV}"
          echo "Coverage threshold: ${env.COVERAGE_MIN}%"
        }
      }
    }

    stage('Install Dependencies') {
      steps {
        dir('backend') {
          sh 'npm ci'
        }

        dir('frontend') {
          sh 'npm ci'
        }
      }
    }

    stage('Quality Checks') {
      steps {
        dir('backend') {
          sh 'find . -path ./node_modules -prune -o -name "*.js" -print -exec node --check {} \\;'
        }

        dir('frontend') {
          sh 'npm run lint'
        }
      }
    }

    stage('Application Tests And Coverage') {
      environment {
        NODE_ENV = 'test'
      }
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-database-url', variable: 'DATABASE_URL'),
          string(credentialsId: 'furious-duck-jwt-secret', variable: 'JWT_SECRET'),
          string(credentialsId: 'furious-duck-turnstile-secret-key', variable: 'TURNSTILE_SECRET_KEY')
        ]) {
          sh '''
            cat > backend/.env <<EOF
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}
EOF

            cd backend
            COVERAGE_MIN=${COVERAGE_MIN} npm run test:coverage
          '''
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'backend/coverage/**', allowEmptyArchive: true
          sh 'rm -f backend/.env'
        }
      }
    }

    stage('Frontend Tests And Coverage') {
      steps {
        dir('frontend') {
          sh 'npm run test:coverage'
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'frontend/coverage/**', allowEmptyArchive: true
        }
      }
    }

    stage('SonarCloud Analysis') {
      when {
        expression {
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH?.replace('origin/', '')
          return branch == 'main'
        }
      }
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-sonarqube-host-url', variable: 'SONAR_HOST_URL'),
          string(credentialsId: 'furious-duck-sonarqube-token', variable: 'SONAR_TOKEN')
        ]) {
          script {
            def scannerHome = tool 'SonarScanner'

            withEnv(["SONAR_SCANNER_HOME=${scannerHome}"]) {
              sh '''
                "$SONAR_SCANNER_HOME/bin/sonar-scanner" \
                  -Dsonar.host.url="$SONAR_HOST_URL" \
                  -Dsonar.token="$SONAR_TOKEN" \
                  -Dsonar.qualitygate.wait=true \
                  -Dsonar.qualitygate.timeout=300
              '''
            }
          }
        }
      }
    }

    stage('Frontend Build') {
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-turnstile-site-key', variable: 'VITE_TURNSTILE_SITE_KEY')
        ]) {
          dir('frontend') {
            sh '''
              cat > .env <<EOF
VITE_API_URL=
VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
EOF

              npm run build
            '''
          }
        }
      }
      post {
        always {
          sh 'rm -f frontend/.env'
        }
      }
    }

    stage('Docker Build Images') {
      steps {
        sh 'docker build -t "$BACKEND_IMAGE" -f backend/Dockerfile.live ./backend'
        sh 'docker build -t "$FRONTEND_IMAGE" -f frontend/Dockerfile.live ./frontend'
      }
    }

    stage('Docker Image Backup') {
      steps {
        sh '''
          mkdir -p "${DOCKER_IMAGE_BACKUP_DIR}"
          docker save "$BACKEND_IMAGE" -o "${DOCKER_IMAGE_BACKUP_DIR}/backend-${BUILD_NUMBER}.tar"
          docker save "$FRONTEND_IMAGE" -o "${DOCKER_IMAGE_BACKUP_DIR}/frontend-${BUILD_NUMBER}.tar"
          ls -lh "${DOCKER_IMAGE_BACKUP_DIR}"
        '''
      }
    }

    stage('Docker Compose Functional Tests') {
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-database-url', variable: 'DATABASE_URL'),
          string(credentialsId: 'furious-duck-jwt-secret', variable: 'JWT_SECRET'),
          string(credentialsId: 'furious-duck-turnstile-secret-key', variable: 'TURNSTILE_SECRET_KEY')
        ]) {
          sh '''
            cat > backend/.env <<EOF
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}
EOF

            cat > frontend/.env <<EOF
VITE_API_URL=
EOF

            docker compose -p "${CI_COMPOSE_PROJECT_NAME}" -f docker-compose.yml -f docker-compose.ci.yml up -d --build

            BACKEND_READY=0
            for i in $(seq 1 30); do
              if docker compose -p "${CI_COMPOSE_PROJECT_NAME}" -f docker-compose.yml -f docker-compose.ci.yml exec -T backend \
                node -e "fetch('http://localhost:5000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
              then
                BACKEND_READY=1
                break
              fi
              sleep 2
            done

            if [ "$BACKEND_READY" != "1" ]; then
              echo "Backend health check failed"
              exit 1
            fi

            docker compose -p "${CI_COMPOSE_PROJECT_NAME}" -f docker-compose.yml -f docker-compose.ci.yml exec -T backend \
              node -e "fetch('http://localhost:5000/api/db/health').then(async r => { console.log(await r.text()); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"

            docker compose -p "${CI_COMPOSE_PROJECT_NAME}" -f docker-compose.yml -f docker-compose.ci.yml exec -T backend npm run test:integration
          '''
        }
      }
      post {
        always {
          sh 'docker compose -p "${CI_COMPOSE_PROJECT_NAME}" -f docker-compose.yml -f docker-compose.ci.yml down --remove-orphans || true'
          sh 'rm -f backend/.env frontend/.env'
        }
      }
    }

    stage('Deploy DEV') {
      when {
        expression {
          return env.DEPLOY_ENV == 'dev'
        }
      }
      steps {
        script {
          deployEnvironment()
        }
      }
    }

    stage('Deploy PREPROD') {
      when {
        expression {
          return env.DEPLOY_ENV == 'preprod'
        }
      }
      steps {
        script {
          deployEnvironment()
        }
      }
    }

    stage('Deploy PROD') {
      when {
        expression {
          return env.DEPLOY_ENV == 'prod'
        }
      }
      steps {
        echo 'PROD deployment is not configured yet. Coverage is checked at 100%, but deployment is intentionally skipped.'
      }
    }
  }
}

def deployEnvironment() {
  withCredentials([
    string(credentialsId: 'furious-duck-database-url', variable: 'DATABASE_URL'),
    string(credentialsId: 'furious-duck-jwt-secret', variable: 'JWT_SECRET'),
    string(credentialsId: 'furious-duck-turnstile-site-key', variable: 'VITE_TURNSTILE_SITE_KEY'),
    string(credentialsId: 'furious-duck-turnstile-secret-key', variable: 'TURNSTILE_SECRET_KEY')
  ]) {
    sh '''
      cat > backend/.env <<EOF
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
TURNSTILE_SECRET_KEY=${TURNSTILE_SECRET_KEY}
APP_URL=${APP_URL}
EOF

      cat > frontend/.env <<EOF
VITE_API_URL=
VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
EOF

      docker compose -p "${COMPOSE_PROJECT_NAME}" \
        -f docker-compose.yml \
        -f docker-compose.dev.live.yml \
        -f docker-compose.monitoring.yml \
        up -d --build --scale backend=2 --scale frontend=2
    '''
  }
}
