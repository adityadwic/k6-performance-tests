# k6 Performance Testing Portfolio

A professional collection of k6 performance testing scripts demonstrating comprehensive load testing capabilities for modern web applications. This repository showcases various testing scenarios including user registration, contact management, and multi-stage performance analysis.

## 🎯 Portfolio Highlights

- **Multi-Scenario Testing**: Complex testing scenarios with user registration and contact creation workflows
- **7-Stage Performance Testing**: Comprehensive ramping, spike, stress, soak, load, volume, and breakpoint testing
- **Modular Architecture**: Clean separation of concerns with helper functions and reusable components
- **Professional Documentation**: Complete with metrics, thresholds, and detailed logging
- **Real-World Simulations**: Authentic API testing patterns with proper authentication flows

## 📁 Project Structure

```
k6-script/
├── package.json                    # Node.js dependencies and scripts
├── package-lock.json              # Dependency lock file
├── report.json                     # Test execution results
├── README.md                       # Main project documentation
└── src/
    ├── basic-scenario/             # 📂 Foundation Testing Patterns
    │   ├── basic-loadTest.js       # Basic load testing example
    │   ├── create-contact.js       # Contact creation performance test
    │   ├── ping-stages.js          # 7-stage comprehensive testing suite
    │   ├── register.js             # User registration performance test
    │   └── scenario.js             # Multi-scenario testing (user + contact workflows)
    ├── helper/                     # 📂 Reusable Utility Modules
    │   ├── contact.js              # Contact management operations
    │   └── user.js                 # User authentication & management
    └── loadtest/                   # 📂 Advanced Load Testing Suite
        ├── README.md               # Load testing documentation
        ├── smoke-test.js           # Basic system validation
        ├── average-load-test.js    # Normal operating conditions
        ├── stress-test.js          # Beyond normal capacity testing
        ├── soak-test.js           # Long-duration reliability test
        ├── spike-test.js          # Sudden massive load simulation
        ├── breakpoint-test.js     # Gradual capacity limit identification
        └── complex-scenario-test.js # Real-world multi-pattern simulation
```

## 🎯 Testing Categories

### 🔧 Basic Scenarios (`src/basic-scenario/`)
Foundation performance tests for core functionality:
- **Basic Load Test**: Simple load testing example with QuickPizza demo
- **User Registration**: Account creation and validation workflows
- **Contact Creation**: Contact management performance testing  
- **Multi-Scenario**: Combined user and contact workflows
- **7-Stage Testing**: Comprehensive ramping, spike, stress, soak, load, volume, and breakpoint testing

### ⚡ Advanced Load Testing (`src/loadtest/`)
Specialized performance testing scenarios:
- **Smoke Test**: Basic system validation (2 VUs, 1 minute)
- **Average Load**: Normal operating conditions (15 VUs, 21 minutes)
- **Stress Test**: Beyond normal capacity (100 VUs, 26 minutes)
- **Soak Test**: Long-duration reliability (25 VUs, 85 minutes)
- **Spike Test**: Sudden massive load simulation (5→200 VUs instant)
- **Breakpoint Test**: Gradual capacity limits (10→300 VUs progressive)
- **Complex Scenario**: Real-world multi-pattern simulation (7 concurrent scenarios, 30 minutes)

## 🚀 Quick Start

```bash
# Install k6
brew install k6  # macOS
# or check Installation section for other OS

# Basic performance testing
k6 run src/basic-scenario/basic-loadTest.js    # Basic load testing example
k6 run src/basic-scenario/ping-stages.js       # 7-stage comprehensive test
k6 run src/basic-scenario/register.js          # User registration test
k6 run src/basic-scenario/create-contact.js    # Contact creation test
k6 run src/basic-scenario/scenario.js          # Combined workflows

# Advanced load testing
k6 run src/loadtest/smoke-test.js           # Quick validation (1 min)
k6 run src/loadtest/average-load-test.js    # Normal conditions (21 min)
k6 run src/loadtest/stress-test.js          # High load testing (26 min)
k6 run src/loadtest/complex-scenario-test.js # Real-world simulation (30 min)
```

## 🎯 Test Scenarios

### 1. **Basic Load Test** (`basic-scenario/basic-loadTest.js`)
Simple load testing example for external websites:
- **QuickPizza Demo**: External website performance testing
- **Homepage Load**: Basic accessibility and response time testing
- **User Journey**: Simple navigation and interaction simulation
- **Performance Metrics**: Response time, throughput, error rate analysis

### 2. **7-Stage Comprehensive** (`basic-scenario/ping-stages.js`)
Seven essential performance tests in one script:
- **Ramping**: Gradual load increase/decrease
- **Spike**: Sudden traffic surge simulation  
- **Stress**: High load capacity testing
- **Soak**: Extended duration stability
- **Load**: Normal operating conditions
- **Volume**: Large data processing
- **Breakpoint**: Maximum capacity identification

### 3. **User Registration Flow** (`basic-scenario/register.js`)
Complete user registration workflow testing:
- Account creation validation
- Authentication flow testing
- User data verification
- Performance under registration load

### 4. **Contact Management** (`basic-scenario/create-contact.js`)
Contact creation and management performance:
- Contact creation workflows
- Authentication token handling
- Data validation testing
- CRUD operation performance

### 5. **Multi-Scenario Testing** (`basic-scenario/scenario.js`)
Combined user and contact workflows:
- Parallel user registration and contact creation
- Real-world usage simulation
- Cross-workflow performance impact
- Integrated system testing

### 6. **Advanced Load Testing Suite** (`loadtest/`)
Comprehensive production-ready testing:
- **Smoke Test**: Basic validation (2 VUs, 1 min)
- **Average Load**: Normal conditions (15 VUs, 21 min)
- **Stress Test**: High capacity (100 VUs, 26 min)
- **Soak Test**: Long duration (25 VUs, 85 min)
- **Spike Test**: Traffic surges (5→200 VUs)
- **Breakpoint Test**: Capacity limits (10→300 VUs)
- **Complex Scenario**: Multi-pattern simulation (7 scenarios, 30 min)

## 📊 Usage Examples

```bash
# Basic scenario testing
k6 run src/basic-scenario/basic-loadTest.js           # Basic load testing example
k6 run src/basic-scenario/ping-stages.js               # 7-stage comprehensive test
k6 run src/basic-scenario/register.js                 # User registration performance
k6 run src/basic-scenario/create-contact.js           # Contact creation performance
k6 run src/basic-scenario/scenario.js                 # Multi-scenario testing

# Advanced load testing
k6 run src/loadtest/smoke-test.js                     # Quick validation (1 min)
k6 run src/loadtest/average-load-test.js              # Normal conditions (21 min)
k6 run src/loadtest/stress-test.js                    # High load testing (26 min)
k6 run src/loadtest/soak-test.js                      # Long duration (85 min)
k6 run src/loadtest/spike-test.js                     # Traffic surge testing
k6 run src/loadtest/breakpoint-test.js                # Capacity limits testing
k6 run src/loadtest/complex-scenario-test.js          # Real-world simulation (30 min)

# Generate detailed reports
k6 run --out json=report.json src/loadtest/stress-test.js

# Custom thresholds
k6 run --threshold http_req_duration=p(95)<1000 src/basic-scenario/ping-stages.js
```

# Custom thresholds
```
k6 run --threshold http_req_duration=p(95)<1000 src/basic-scenario/ping-stages.js
```

## 📊 Test Reports & Monitoring

### 🌐 Web Dashboard
Enable real-time monitoring during test execution:
```bash
# Enable web dashboard (available at http://127.0.0.1:5665)
K6_WEB_DASHBOARD=true k6 run src/loadtest/stress-test.js
```
<img width="1439" height="855" alt="Web Dashboard - K6" src="https://github.com/user-attachments/assets/eec67e40-666d-47ee-9713-3774eda85a07" />

### 📈 Grafana Dashboard  
Export results for advanced visualization:
```bash
# Export to InfluxDB for Grafana
k6 run --out influxdb=http://localhost:8086/k6 src/loadtest/average-load-test.js

# Export to Grafana Cloud
k6 run --out cloud src/loadtest/complex-scenario-test.js
```
<img width="1439" height="776" alt="Grafana Dashboard" src="https://github.com/user-attachments/assets/05687f4d-64bc-4e20-9ce5-6a780eec071e" />
<img width="1439" height="775" alt="grafana-Dashboard-2" src="https://github.com/user-attachments/assets/20d33089-51b1-4dc8-b558-b9082752bdca" />

> 📸 **Report Screenshots**: Test execution reports and dashboard visualizations are included in the repository for reference.

## ⚙️ Prerequisites

### k6 Installation
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
choco install k6
```

### Target Application
- Application running on `https://contact.do.my.id`
- Available endpoints: `/api/users/register`, `/api/users/login`, `/api/users/{username}`, `/api/contacts`, `/ping`
- Authentication: Bearer token based
- Test data: Automated user and contact creation

## 🔧 Customization

### Modify Target URL
```javascript
const response = http.get('http://your-app.com/api/endpoint');
```

### Adjust Load Patterns
```javascript
export const options = {
  scenarios: {
    your_scenario: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Customize these values
        { duration: '1m', target: 100 },
      ],
    },
  },
};
```

### Add Custom Validations
```javascript
check(response, {
  'status is 200': (r) => r.status === 200,
  'response time < 500ms': (r) => r.timings.duration < 500,
  'contains expected data': (r) => r.body.includes('expected_content'),
});
```

## 📈 Performance Thresholds

Default thresholds across all tests:
- **Response Time**: p(95) < 500ms
- **Error Rate**: < 10%
- **Request Success**: > 90%

## 🔍 Key Metrics

Monitor these essential metrics:
- `http_req_duration`: Response time percentiles
- `http_req_failed`: Error rate percentage
- `http_reqs`: Requests per second (RPS)
- `vus`: Current virtual users
- `iterations`: Total test iterations

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| High error rates | Check server logs, verify endpoints |
| Slow response times | Monitor server resources, check database |
| Connection failures | Verify network settings, firewall rules |
| Test script errors | Validate JSON syntax, check variable names |

## 📋 Best Practices

1. **Start Small**: Begin with low loads, gradually increase
2. **Monitor Resources**: Watch CPU, memory, network during tests
3. **Consistent Environment**: Use clean, isolated test environment
4. **Baseline First**: Establish performance baseline before changes
5. **Document Results**: Keep test configurations and results

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add test scenarios with documentation
4. Submit pull request

## 📚 Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6/tree/master/examples)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/)
