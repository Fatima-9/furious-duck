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

    stage('Backend - Unit Tests') {
      environment {
        JWT_SECRET = 'jenkins-unit-test-secret'
      }
      steps {
        dir('backend') {
          sh 'npm run test:unit'
        }
      }
    }

    stage('Backend - Integration Tests') {
      steps {
        withCredentials([
          string(credentialsId: 'furious-duck-database-url', variable: 'DATABASE_URL'),
          string(credentialsId: 'furious-duck-jwt-secret', variable: 'JWT_SECRET')
        ]) {
          dir('backend') {
            sh '''
              cat > .env <<EOF
PORT=5000
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
EOF

              npm run test:integration
            '''
          }
        }
      }
      post {
        always {
          sh 'rm -f backend/.env'
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

    stage('Docker Compose - Functional Tests') {
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
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
EOF

            docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build

            for i in $(seq 1 30); do
              if docker compose -f docker-compose.yml -f docker-compose.ci.yml exec -T backend \
                node -e "fetch('http://localhost:5000/api/health').then(r => { if (!r.ok) process.exit(1); process.exit(0) }).catch(() => process.exit(1))"
              then
                break
              fi
              sleep 2
            done

            docker compose -f docker-compose.yml -f docker-compose.ci.yml exec -T backend \
              node -e "fetch('http://localhost:5000/api/health').then(async r => { console.log(await r.text()); if (!r.ok) process.exit(1) }).catch(e => { console.error(e); process.exit(1) })"

            docker compose -f docker-compose.yml -f docker-compose.ci.yml exec -T backend \
              node -e "fetch('http://localhost:5000/api/db/health').then(async r => { console.log(await r.text()); if (!r.ok) process.exit(1) }).catch(e => { console.error(e); process.exit(1) })"

            docker compose -f docker-compose.yml -f docker-compose.ci.yml exec -T backend npm run test:integration
          '''
        }
      }
      post {
        always {
          sh 'docker compose -f docker-compose.yml -f docker-compose.ci.yml down || true'
          sh 'rm -f backend/.env'
        }
      }
    }

    stage('Deploy DEV') {
      when {
        expression {
          return env.GIT_BRANCH == 'origin/DEV' || env.BRANCH_NAME == 'DEV'
        }
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
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
APP_URL=https://dev.dsp5-archi-o24a-g2.fr
EOF

            cat > frontend/.env <<EOF
VITE_API_URL=
EOF

            docker compose -p furious-duck-dev-live \
              -f docker-compose.yml \
              -f docker-compose.dev.live.yml \
              -f docker-compose.monitoring.yml \
              up -d --build --scale backend=2 --scale frontend=2
          '''
        }
      }
    }

    stage('Deploy PREPROD') {
      when {
        expression {
          return env.GIT_BRANCH == 'origin/PREPROD' || env.BRANCH_NAME == 'PREPROD'
        }
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
RESET_TOKEN_EXPIRES_IN_MINUTES=${RESET_TOKEN_EXPIRES_IN_MINUTES}
DEFAULT_USER_ROLE_ID=${DEFAULT_USER_ROLE_ID}
DEFAULT_BOUTIQUE_ID=${DEFAULT_BOUTIQUE_ID}
APP_URL=https://preprod.dsp5-archi-o24a-g2.fr
EOF

            cat > frontend/.env <<EOF
VITE_API_URL=
EOF

            docker compose -p furious-duck-preprod-live \
              -f docker-compose.yml \
              -f docker-compose.dev.live.yml \
              -f docker-compose.monitoring.yml \
              up -d --build --scale backend=2 --scale frontend=2
          '''
        }
      }
    }
  }
}
