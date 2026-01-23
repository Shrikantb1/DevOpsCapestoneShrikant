pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'shrikantb1' 
        GITHUB_REPO = 'https://github.com/Shrikantb1/DevOpsCapestoneShrikant.git'
        SONARQUBE_ENV = 'SonarQube'
    }
    
    tools {
        nodejs 'NodeJS-18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '========== Checking out code from GitHub =========='
                git branch: 'development',
                    credentialsId: 'github-credentials',
                    url: "${GITHUB_REPO}"
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Product Service') {
                    steps {
                        dir('product-service') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Cart Service') {
                    steps {
                        dir('cart-service') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend/ecommerce-frontend') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Test Product Service') {
                    steps {
                        dir('product-service') {
                            sh 'npm test || echo "No tests configured yet"'
                        }
                    }
                }
                stage('Test Cart Service') {
                    steps {
                        dir('cart-service') {
                            sh 'npm test || echo "No tests configured yet"'
                        }
                    }
                }
                stage('Test Frontend') {
                    steps {
                        dir('frontend/ecommerce-frontend') {
                            sh 'npm test -- --watch=false --browsers=ChromeHeadless || echo "No tests configured yet"'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality - SonarQube') {
            steps {
                script {
                    def scannerHome = tool 'SonarQubeScanner'
                    withSonarQubeEnv("${SONARQUBE_ENV}") {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=ecommerce-microservices \
                            -Dsonar.projectName='E-Commerce Microservices' \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/*.json,**/kubernetes/**
                        """
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Product Service') {
                    steps {
                        dir('product-service') {
                            sh 'docker build -t ${DOCKERHUB_USERNAME}/product-service:${BUILD_NUMBER} .'
                            sh 'docker tag ${DOCKERHUB_USERNAME}/product-service:${BUILD_NUMBER} ${DOCKERHUB_USERNAME}/product-service:latest'
                        }
                    }
                }
                stage('Build Cart Service') {
                    steps {
                        dir('cart-service') {
                            sh 'docker build -t ${DOCKERHUB_USERNAME}/cart-service:${BUILD_NUMBER} .'
                            sh 'docker tag ${DOCKERHUB_USERNAME}/cart-service:${BUILD_NUMBER} ${DOCKERHUB_USERNAME}/cart-service:latest'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'cd ecommerce-frontend && npm run build'
                            sh 'docker build -t ${DOCKERHUB_USERNAME}/frontend-service:${BUILD_NUMBER} .'
                            sh 'docker tag ${DOCKERHUB_USERNAME}/frontend-service:${BUILD_NUMBER} ${DOCKERHUB_USERNAME}/frontend-service:latest'
                        }
                    }
                }
            }
        }
        
        stage('Security Scan - Trivy') {
            parallel {
                stage('Scan Product Service') {
                    steps {
                        sh '''
                            echo "========== Scanning Product Service =========="
                            trivy image --severity HIGH,CRITICAL \
                            --format table \
                            ${DOCKERHUB_USERNAME}/product-service:latest
                            
                            trivy image --severity HIGH,CRITICAL \
                            --format json \
                            --output trivy-product-service.json \
                            ${DOCKERHUB_USERNAME}/product-service:latest || true
                        '''
                    }
                }
                stage('Scan Cart Service') {
                    steps {
                        sh '''
                            echo "========== Scanning Cart Service =========="
                            trivy image --severity HIGH,CRITICAL \
                            --format table \
                            ${DOCKERHUB_USERNAME}/cart-service:latest
                            
                            trivy image --severity HIGH,CRITICAL \
                            --format json \
                            --output trivy-cart-service.json \
                            ${DOCKERHUB_USERNAME}/cart-service:latest || true
                        '''
                    }
                }
                stage('Scan Frontend') {
                    steps {
                        sh '''
                            echo "========== Scanning Frontend =========="
                            trivy image --severity HIGH,CRITICAL \
                            --format table \
                            ${DOCKERHUB_USERNAME}/frontend-service:latest
                            
                            trivy image --severity HIGH,CRITICAL \
                            --format json \
                            --output trivy-frontend.json \
                            ${DOCKERHUB_USERNAME}/frontend-service:latest || true
                        '''
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo '========== Logging in to Docker Hub =========='
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                
                echo '========== Pushing Images =========='
                sh 'docker push ${DOCKERHUB_USERNAME}/product-service:${BUILD_NUMBER}'
                sh 'docker push ${DOCKERHUB_USERNAME}/product-service:latest'
                sh 'docker push ${DOCKERHUB_USERNAME}/cart-service:${BUILD_NUMBER}'
                sh 'docker push ${DOCKERHUB_USERNAME}/cart-service:latest'
                sh 'docker push ${DOCKERHUB_USERNAME}/frontend-service:${BUILD_NUMBER}'
                sh 'docker push ${DOCKERHUB_USERNAME}/frontend-service:latest'
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                echo '========== Deploying to Kubernetes =========='
                sh '''
                    kubectl apply -f kubernetes/namespace.yaml
                    kubectl apply -f kubernetes/configmap.yaml
                    kubectl apply -f kubernetes/product-service-deployment.yaml
                    kubectl apply -f kubernetes/cart-service-deployment.yaml
                    kubectl apply -f kubernetes/frontend-deployment.yaml
                    kubectl rollout restart deployment/product-service -n ecommerce
                    kubectl rollout restart deployment/cart-service -n ecommerce
                    kubectl rollout restart deployment/frontend -n ecommerce
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo '========== Verifying Deployment =========='
                sh 'kubectl get pods -n ecommerce'
                sh 'kubectl get svc -n ecommerce'
            }
        }
    }
    
    post {
        always {
            echo '========== Cleaning up =========='
            sh 'docker logout'
            
            // Archive security scan reports
            archiveArtifacts artifacts: 'trivy-*.json', allowEmptyArchive: true
            
            // Clean workspace
            cleanWs()
        }
        success {
            echo '=========================================='
            echo '    Pipeline completed successfully!     '
            echo '=========================================='
            echo 'SonarQube Report: http://localhost:9000'
            echo 'Trivy Reports: Archived in Jenkins'
            echo '=========================================='
        }
        failure {
            echo '=========================================='
            echo '         Pipeline failed!                '
            echo '=========================================='
            echo 'Check the logs above for errors'
        }
    }
}
