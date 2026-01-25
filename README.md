Created a project in angular using JSON. An ecommerce cart service.
The service has 5 products, Each product has "Add to Cart" button, clear cart option etc. 
Created a microservice using Node.js. and NPM. 

Committed to git. 

In cmd,shell,ubuntu :

cd ~/Capestone
git branch
git status
git add .
git push -u origin development
Username: Shrikantb1
Password: ( Personal Access Token)
git push -u origin development

Docker containerization

docker --version
Docker version 29.1.3

Create docker images for the 3 files :

docker build -t product-service:latest .
docker build -t cart-service:latest .

Create a Dockerfile for frontend image :

nano Dockerfile
docker build -t frontend-service:latest .

View the images created : 
docker images

create docker-compose.yaml file to run all services together with one command: 
nano docker-compose.yml

Check the containers :
docker-compose ps

access the services:
Product API: http://localhost:3001/api/products
Product Health: http://localhost:3001/health
Cart Health: http://localhost:3002/health
frontend:  http://localhost:4200

Add the new files to git : 
git add docker-compose.yml
git add frontend/Dockerfile
git add frontend/nginx.conf
git add frontend/ecommerce-frontend/src/environments/environment.prod.ts

 
git commit -m "feat: Complete Docker containerization

- Frontend Dockerfile with nginx
- nginx.conf for serving Angular app
- docker-compose.yml for all services
- All services tested and working in containers"

git push

Push the docker images to docker hub registory

Start minikube
minikube start --driver=docker --cpus=4 --memory=8192
minikube status

# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
# kubeconfig: Configured

kubectl get nodes
# minikube   Ready    control-plane   2m    v1.28.0

Create kubernetes directory and its associated files for deployment:
mkdir -p kubernetes
cd kubernetes
nano product-service-deployment.yaml
nano cart-service-deployment.yaml
nano frontend-deployment.yaml

Deploy to kubernetes:
kubectl apply -f namespace.yaml

# Deploy all services
kubectl apply -f product-service-deployment.yaml
kubectl apply -f cart-service-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f configmap.yaml

# Verify deployments
kubectl get all -n ecommerce

# Add kubernetes file to git 
git add kubernetes
git commit -m "feat: Add Kubernetes deployment manifests

- Namespace for ecommerce application
- Product service deployment with 2 replicas
- Cart service deployment with 2 replicas
- Frontend deployment with NodePort service
- ConfigMap for environment variables
- Health checks and resource limits configured"

git push

# Jenkins CI/CD Pipeline Setup :
# install jenkins
sudo apt install -y jenkins

sudo systemctl start jenkins
sudo systemctl enable jenkins

# Run Jenkins in Docker
docker run -d \
  --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts

# Get initial admin password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Install Required Jenkins Plugins
Docker,kubernetes, nodejs,credential binding, Git, pipeline, SonarQube, Trivy 

# Configure tools
Go to: Manage Jenkins → Tools
Add NodeJS-18
Add Docker

# Add credentials to jenkins
Go to: Manage Jenkins → Credentials
System → Global credentials → Add Credential
Add Docker hub credentials
Add Git hub credentials

# Install SonarQube (Code Quality Analysis)
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  sonarqube:lts-community

http://localhost:9000 (sonarQube)

# Configure SonarQube in Jenkins
Go to: Jenkins → Manage Jenkins → System
add sonarQube servers

# Install Trivy (Security Scanner)
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list

sudo apt-get update
sudo apt-get install trivy -y
trivy --version


# Create Jenkins directory
mkdir -p jenkins
cd jenkins
nano Jenkinsfile

# Commit Jenkinsfile to GIT
git add Jenkinsfile jenkins/

# Commit
git commit -m "feat: Add Jenkins CI/CD pipeline

- Complete pipeline with parallel stages
- Unit testing for all services
- SonarQube code quality analysis
- Trivy security scanning
- Docker image building and pushing
- Kubernetes deployment automation
- Build versioning with BUILD_NUMBER"

# Push
git push

docker ps -a | grep jenkins
http://localhost:8080
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

Check SonarQube Status
docker ps | grep sonarqube
Open browser: http://localhost:9000

Test trivy : 
trivy image shrikantb1/product-service:latest

#  Verify all tools
docker exec jenkins docker --version
docker exec jenkins kubectl version --client
docker exec jenkins trivy --version
docker exec jenkins git --version



