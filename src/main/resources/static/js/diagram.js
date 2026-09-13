function initializeDiagramPage() {
    const diagramRoot = document.getElementById("diagram-root");
    if (!diagramRoot) {
        return;
    }

    const logic = window.DiagramLogic;
    if (!logic) {
        console.error("DiagramLogic is required before diagram.js");
        return;
    }
    const spacesPanel = document.getElementById("spaces-panel");
    const spacesToggle = document.getElementById("diagram-spaces-toggle");
    const spacesToggleIcon = document.getElementById("diagram-spaces-toggle-icon");
    const spacesOpenButton = document.getElementById("diagram-spaces-open");
    const spacesTexts = Array.from(diagramRoot.querySelectorAll("[data-spaces-text]"));
    const spacesAction = diagramRoot.querySelector("[data-spaces-action]");
    const spacesHeader = diagramRoot.querySelector("[data-spaces-header]");
    const spacesHeaderTitle = diagramRoot.querySelector("[data-spaces-header-title]");
    const spacesHeaderExpander = diagramRoot.querySelector("[data-spaces-header-expander]");
    const spacesCollapsedIcon = diagramRoot.querySelector("[data-spaces-collapsed-icon]");
    const spacesScroll = diagramRoot.querySelector("[data-spaces-scroll]");
    const spacesRows = Array.from(diagramRoot.querySelectorAll("[data-spaces-row]"));
    const spacesExpanders = Array.from(diagramRoot.querySelectorAll("[data-spaces-expander]"));
    const spacesFooter = diagramRoot.querySelector("[data-spaces-footer]");
    const spaceGroups = Array.from(diagramRoot.querySelectorAll("[data-space-group]"));
    const zoomLayer = document.getElementById("zoom-layer");
    const diagramStage = document.getElementById("diagram-stage");
    const zoomInButton = document.getElementById("diagram-zoom-in");
    const zoomOutButton = document.getElementById("diagram-zoom-out");
    const zoomValue = document.getElementById("diagram-zoom-value");
    const shapeToolButton = document.getElementById("diagram-shape-tool");
    const shapeMenu = document.getElementById("diagram-shape-menu");
    const shapeMenuButtons = Array.from(diagramRoot.querySelectorAll("[data-shape-tool]"));
    const lineToolButton = document.getElementById("diagram-line-tool");
    const lineMenu = document.getElementById("diagram-line-menu");
    const lineMenuButtons = Array.from(diagramRoot.querySelectorAll("[data-line-preset]"));
    const toolButtons = Array.from(diagramRoot.querySelectorAll("[data-diagram-tool]"));
    const selectedNodeName = document.getElementById("diagram-selected-node-name");
    const selectedNodeType = document.getElementById("diagram-selected-node-type");
    const selectedNodeIcon = document.getElementById("diagram-selected-node-icon");
    const selectedNodeIconWrap = document.getElementById("diagram-selected-node-icon-wrap");
    const propertiesPanel = document.getElementById("diagram-properties-panel");
    const propertiesCloseButton = document.getElementById("diagram-properties-close");
    const propertyTabsContainer = diagramRoot.querySelector(".diagram-property-tabs");
    const propertyTabs = Array.from(diagramRoot.querySelectorAll("[data-property-tab]"));
    const propertyPanels = Array.from(diagramRoot.querySelectorAll("[data-property-panel]"));
    const nodeLabelInput = document.getElementById("diagram-node-label-input");
    const nodeBadgeInput = document.getElementById("diagram-node-badge-input");
    const badgePositionButtons = Array.from(diagramRoot.querySelectorAll("[data-badge-position]"));
    const badgeColorValue = document.getElementById("diagram-badge-color-value");
    const badgeColorButtons = Array.from(diagramRoot.querySelectorAll("[data-badge-color]"));
    const badgeColorPicker = document.getElementById("diagram-badge-color-picker");
    let linePaths = Array.from(diagramRoot.querySelectorAll("[data-line-from][data-line-to]"));
    const textColorValue = document.getElementById("diagram-text-color-value");
    const textColorButtons = Array.from(diagramRoot.querySelectorAll("[data-text-color]"));
    const textColorPicker = document.getElementById("diagram-text-color-picker");
    const textFontFamilyInput = document.getElementById("diagram-text-font-family");
    const textFontSizeInput = document.getElementById("diagram-text-font-size");
    const textFontSizeValue = document.getElementById("diagram-text-font-size-value");
    const fillColorValue = document.getElementById("diagram-fill-color-value");
    const fillColorButtons = Array.from(diagramRoot.querySelectorAll("[data-fill-color]"));
    const fillColorPicker = document.getElementById("diagram-fill-color-picker");
    const strokeColorValue = document.getElementById("diagram-stroke-color-value");
    const strokeColorButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-color]"));
    const strokeColorPicker = document.getElementById("diagram-stroke-color-picker");
    const strokeWidthInput = document.getElementById("diagram-stroke-width-input");
    const strokeWidthValue = document.getElementById("diagram-stroke-width-value");
    const nodeOpacityInput = document.getElementById("diagram-node-opacity-input");
    const nodeOpacityValue = document.getElementById("diagram-node-opacity-value");
    const strokeStyleButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-style]"));
    let lineTypeButtons = Array.from(diagramRoot.querySelectorAll("[data-line-type]"));
    const lineDashButtons = Array.from(diagramRoot.querySelectorAll("[data-line-dash]"));
    const lineColorValue = document.getElementById("diagram-line-color-value");
    const lineColorButtons = Array.from(diagramRoot.querySelectorAll("[data-line-color]"));
    const lineColorPicker = document.getElementById("diagram-line-color-picker");
    const lineAnimatedInput = document.getElementById("diagram-line-animated");
    const lineStartArrowButtons = Array.from(diagramRoot.querySelectorAll("[data-line-start-arrow]"));
    const lineEndArrowButtons = Array.from(diagramRoot.querySelectorAll("[data-line-end-arrow]"));
    const lineMotionButtons = Array.from(diagramRoot.querySelectorAll("[data-line-motion], [data-line-animation-direction]"));
    const lineBadgeInput = document.getElementById("diagram-line-badge-input");
    const lineBadgeColorValue = document.getElementById("diagram-line-badge-color-value");
    const lineBadgeColorButtons = Array.from(diagramRoot.querySelectorAll("[data-line-badge-color]"));
    const lineBadgeColorPicker = document.getElementById("diagram-line-badge-color-picker");
    const iconPickerTrigger = document.getElementById("diagram-icon-picker-trigger");
    const iconLibraryPanel = document.getElementById("diagram-icon-library-panel");
    const iconLibraryClose = document.getElementById("diagram-icon-library-close");
    const iconLibraryCancel = document.getElementById("diagram-icon-library-cancel");
    const iconLibraryApply = document.getElementById("diagram-icon-library-apply");
    const iconLibraryTabList = document.getElementById("diagram-icon-library-tabs");
    const iconLibraryTabs = Array.from(diagramRoot.querySelectorAll("[data-icon-category]"));
    const iconServiceGroups = document.getElementById("diagram-icon-service-groups");
    const iconSearchInput = document.getElementById("diagram-icon-search");
    const iconGrid = document.getElementById("diagram-icon-grid");
    const iconEmpty = document.getElementById("diagram-icon-empty");
    const currentIconPreview = document.getElementById("diagram-current-icon-preview");
    const currentIconLabel = document.getElementById("diagram-current-icon-label");
    const draftIconPreview = document.getElementById("diagram-icon-draft-preview");
    const draftIconLabel = document.getElementById("diagram-icon-draft-label");
    const iconColorValue = document.getElementById("diagram-icon-color-value");
    const iconColorHelp = document.getElementById("diagram-icon-color-help");
    const iconColorModeButtons = Array.from(diagramRoot.querySelectorAll("[data-icon-color-mode]"));
    const iconCustomColors = document.getElementById("diagram-icon-custom-colors");
    const iconCustomColorButtons = Array.from(diagramRoot.querySelectorAll("[data-icon-custom-color]"));
    const iconCustomColorPicker = document.getElementById("diagram-icon-custom-color-picker");
    const iconPositionButtons = Array.from(diagramRoot.querySelectorAll("[data-icon-position]"));

    if (!spacesPanel) {
        return;
    }

    let currentScale = 1;
    let activeTool = "select";
    let selectedNode = null;
    let selectedNodes = [];
    let selectedLine = null;
    let nodeClipboard = [];
    let pasteOffset = 0;
    let selectedShapeTool = "rectangle";
    let selectedLinePreset = "straight-arrow";
    const lineHitPaths = new WeakMap();
    const lineHandleGroups = new WeakMap();
    const lineBadges = new WeakMap();
    let lineDrag = null;
    let isTemporaryMoveActive = false;
    let stagePanX = 0;
    let stagePanY = 0;
    let startStagePanX = 0;
    let startStagePanY = 0;
    const lineConnectSnapPadding = 28;
    const lineConnectAnchorSnapRadius = 42;
    const lineConnectAnchorAttachRadius = 30;

    const colorWithOpacity = (color, opacityPercent) => {
        const opacity = Math.max(0, Math.min(100, Number(opacityPercent))) / 100;
        const value = String(color || "").trim();
        if (!value || value === "transparent") {
            return "transparent";
        }
        const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (hex) {
            const source = hex[1].length === 3
                ? hex[1].split("").map((char) => char + char).join("")
                : hex[1];
            const r = parseInt(source.slice(0, 2), 16);
            const g = parseInt(source.slice(2, 4), 16);
            const b = parseInt(source.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
        if (rgb) {
            const [r, g, b, a] = rgb[1].split(",").map((part) => part.trim());
            if (r && g && b) {
                const sourceOpacity = a === undefined ? 1 : Math.max(0, Math.min(1, Number(a)));
                return `rgba(${r}, ${g}, ${b}, ${sourceOpacity * opacity})`;
            }
        }
        return value;
    };

    let selectionFrame = null;
    let nodeCounter = diagramRoot.querySelectorAll("[data-diagram-node]").length;
    let diagramCounter = diagramRoot.querySelectorAll("[data-space-diagram]").length + 1;
    let groupCounter = spaceGroups.length + 1;
    let activeIconCategory = "all";
    let activeIconGroup = "all";
    let draftIcon = null;
    let iconLibraryNode = null;
    let originalIconSnapshot = null;
    let iconColorModeTouched = false;
    const historyStack = [];
    let isRestoringHistory = false;
    const maxHistorySize = 80;

    const iconCategoryColors = {
        default: {
            서버: "#3B82F6", 데이터베이스: "#10B981", API: "#F97316", "외부 서비스": "#A855F7",
            클라이언트: "#EC4899", "메시지 큐": "#EAB308", 사용자: "#64748B", 모바일: "#14B8A6"
        },
        infra: {
            Docker: "#2496ED", Kubernetes: "#326CE5", Nginx: "#009639", Traefik: "#18A1FF", Ingress: "#0F766E",
            Redis: "#DC382D", PostgreSQL: "#336791", MySQL: "#00758F", MongoDB: "#47A248",
            Elasticsearch: "#005571", OpenSearch: "#005571", Kafka: "#334155", RabbitMQ: "#FF6600", NATS: "#334155",
            CDN: "#06B6D4", "Load Balancer": "#6366F1", DNS: "#7C3AED", Firewall: "#EF4444", WAF: "#DC2626",
            Vault: "#6D28D9", Prometheus: "#E6522C", Grafana: "#F46800", Loki: "#0EA5E9", Jaeger: "#7C3AED",
            Registry: "#475569", Artifacts: "#475569", Backup: "#0EA5E9"
        },
        modeling: {
            프로세스: "#334155", 의사결정: "#D97706", "시작/종료": "#059669", 문서: "#2563EB",
            입출력: "#0891B2", 서브프로세스: "#7C3AED", "데이터 저장소": "#4F46E5", 텍스트: "#E11D48"
        }
    };
    const iconCategoryDefaultColors = { aws: "#FF9900", gcp: "#4285F4", azure: "#0078D4", infra: "#475569", modeling: "#475569", default: "#64748B" };
    const cloudIconCategories = ["aws", "gcp", "azure"];
    const iconGroupLabels = {
        compute: "컴퓨팅", container: "컨테이너", storage: "스토리지", database: "데이터베이스",
        network: "네트워크", integration: "통합", data: "데이터", ai: "AI/ML", security: "보안/운영"
    };
    const iconCategoryItems = (category, items) => items.map(([name, label, groupOrKeywords = "", keywords = ""]) => ({
        category,
        set: "remix",
        name,
        label,
        group: cloudIconCategories.includes(category) ? groupOrKeywords : "general",
        keywords: cloudIconCategories.includes(category) ? `${keywords} ${iconGroupLabels[groupOrKeywords] || ""}` : groupOrKeywords,
        color: iconCategoryColors[category]?.[label] || iconCategoryDefaultColors[category]
    }));
    const diagramIcons = [
        { category: "default", set: "none", name: "", label: "아이콘 없음", keywords: "none empty 없음 제거", color: "#76777D" },
        ...iconCategoryItems("default", [
            ["ri-server-line", "서버"], ["ri-database-2-line", "데이터베이스"], ["ri-global-line", "API"],
            ["ri-cloud-line", "외부 서비스"], ["ri-computer-line", "클라이언트"], ["ri-stack-line", "메시지 큐"],
            ["ri-user-line", "사용자"], ["ri-smartphone-line", "모바일"]
        ]),
        ...iconCategoryItems("aws", [
            ["ri-server-line", "EC2", "compute", "가상 머신 VM"],
            ["ri-flashlight-line", "Lambda", "compute", "서버리스 함수 function"],
            ["ri-ship-line", "ECS", "container", "컨테이너 오케스트레이션"],
            ["ri-settings-3-line", "EKS", "container", "쿠버네티스 Kubernetes"],
            ["ri-cloud-line", "Fargate", "container", "서버리스 컨테이너"],
            ["ri-hard-drive-2-line", "S3", "storage", "오브젝트 스토리지 버킷"],
            ["ri-hard-drive-line", "EBS", "storage", "블록 스토리지 볼륨"],
            ["ri-folder-line", "EFS", "storage", "파일 스토리지"],
            ["ri-database-2-line", "RDS", "database", "관계형 데이터베이스 SQL"],
            ["ri-database-2-line", "Aurora", "database", "MySQL PostgreSQL"],
            ["ri-database-line", "DynamoDB", "database", "NoSQL 키 값"],
            ["ri-speed-line", "ElastiCache", "database", "Redis Valkey 캐시"],
            ["ri-global-line", "VPC", "network", "가상 네트워크"],
            ["ri-git-branch-line", "Elastic Load Balancing", "network", "ELB 로드 밸런서"],
            ["ri-global-line", "CloudFront", "network", "CDN 콘텐츠 전송"],
            ["ri-compass-3-line", "Route 53", "network", "DNS 도메인"],
            ["ri-node-tree", "API Gateway", "network", "API 관리 게이트웨이"],
            ["ri-stack-line", "SQS", "integration", "메시지 큐"],
            ["ri-broadcast-line", "SNS", "integration", "알림 pub sub"],
            ["ri-broadcast-line", "EventBridge", "integration", "이벤트 버스"],
            ["ri-git-merge-line", "Step Functions", "integration", "워크플로 상태 머신"],
            ["ri-bar-chart-line", "Redshift", "data", "데이터 웨어하우스 분석"],
            ["ri-pulse-line", "Kinesis", "data", "스트리밍 데이터"],
            ["ri-sparkling-2-line", "Bedrock", "ai", "생성형 AI 에이전트 파운데이션 모델"],
            ["ri-brain-line", "SageMaker AI", "ai", "머신러닝 ML 모델"],
            ["ri-key-line", "IAM", "security", "권한 자격 증명"],
            ["ri-shield-flash-line", "AWS WAF", "security", "웹 방화벽"],
            ["ri-lock-line", "Secrets Manager", "security", "비밀 키 보안"],
            ["ri-line-chart-line", "CloudWatch", "security", "모니터링 로그 메트릭"]
        ]),
        ...iconCategoryItems("gcp", [
            ["ri-server-line", "Compute Engine", "compute", "가상 머신 VM"],
            ["ri-rocket-line", "Cloud Run", "compute", "서버리스 애플리케이션"],
            ["ri-flashlight-line", "Cloud Run functions", "compute", "Cloud Functions 함수"],
            ["ri-building-4-line", "App Engine", "compute", "애플리케이션 플랫폼 PaaS"],
            ["ri-settings-3-line", "Google Kubernetes Engine", "container", "GKE 쿠버네티스"],
            ["ri-apps-line", "Artifact Registry", "container", "컨테이너 이미지 패키지"],
            ["ri-hard-drive-2-line", "Cloud Storage", "storage", "오브젝트 스토리지 버킷"],
            ["ri-folder-line", "Filestore", "storage", "파일 스토리지"],
            ["ri-database-2-line", "Cloud SQL", "database", "MySQL PostgreSQL SQL Server"],
            ["ri-database-2-line", "AlloyDB", "database", "PostgreSQL 호환"],
            ["ri-database-line", "Spanner", "database", "분산 관계형 데이터베이스"],
            ["ri-file-list-3-line", "Firestore", "database", "문서 NoSQL MongoDB"],
            ["ri-speed-line", "Memorystore", "database", "Redis Valkey Memcached 캐시"],
            ["ri-global-line", "VPC", "network", "가상 네트워크"],
            ["ri-git-branch-line", "Cloud Load Balancing", "network", "로드 밸런서"],
            ["ri-global-line", "Cloud CDN", "network", "콘텐츠 전송"],
            ["ri-compass-3-line", "Cloud DNS", "network", "도메인"],
            ["ri-node-tree", "Apigee API Management", "network", "API 게이트웨이 관리"],
            ["ri-broadcast-line", "Pub/Sub", "integration", "메시징 이벤트"],
            ["ri-git-merge-line", "Workflows", "integration", "워크플로 오케스트레이션"],
            ["ri-flashlight-line", "Eventarc", "integration", "이벤트 라우팅"],
            ["ri-bar-chart-line", "BigQuery", "data", "데이터 웨어하우스 분석"],
            ["ri-pulse-line", "Dataflow", "data", "스트림 배치 처리"],
            ["ri-brain-line", "Vertex AI", "ai", "Gemini 머신러닝 모델"],
            ["ri-sparkling-2-line", "Gemini Enterprise Agent Platform", "ai", "에이전트 생성형 AI"],
            ["ri-key-line", "Cloud IAM", "security", "권한 자격 증명"],
            ["ri-lock-line", "Secret Manager", "security", "비밀 키 보안"],
            ["ri-line-chart-line", "Cloud Monitoring", "security", "관측 모니터링 로그"]
        ]),
        ...iconCategoryItems("azure", [
            ["ri-server-line", "Virtual Machines", "compute", "가상 머신 VM"],
            ["ri-stack-line", "Virtual Machine Scale Sets", "compute", "VMSS 오토스케일"],
            ["ri-building-4-line", "App Service", "compute", "웹 앱 PaaS"],
            ["ri-flashlight-line", "Azure Functions", "compute", "서버리스 함수"],
            ["ri-cloud-line", "Azure Container Apps", "container", "서버리스 컨테이너"],
            ["ri-settings-3-line", "Azure Kubernetes Service", "container", "AKS 쿠버네티스"],
            ["ri-apps-line", "Azure Container Registry", "container", "ACR 이미지 레지스트리"],
            ["ri-hard-drive-2-line", "Blob Storage", "storage", "오브젝트 스토리지"],
            ["ri-folder-line", "Azure Files", "storage", "파일 스토리지"],
            ["ri-database-2-line", "Azure SQL Database", "database", "관계형 SQL"],
            ["ri-database-line", "Azure Cosmos DB", "database", "NoSQL 분산 데이터베이스"],
            ["ri-database-2-line", "Azure Database for PostgreSQL", "database", "Postgres 관계형"],
            ["ri-file-list-3-line", "Azure DocumentDB", "database", "MongoDB 호환 문서 데이터베이스"],
            ["ri-speed-line", "Azure Managed Redis", "database", "인메모리 캐시"],
            ["ri-global-line", "Virtual Network", "network", "VNet 가상 네트워크"],
            ["ri-git-branch-line", "Azure Load Balancer", "network", "로드 밸런서"],
            ["ri-shield-flash-line", "Application Gateway", "network", "WAF L7 게이트웨이"],
            ["ri-apps-line", "Azure Front Door", "network", "글로벌 CDN 엣지"],
            ["ri-compass-3-line", "Azure DNS", "network", "도메인"],
            ["ri-node-tree", "API Management", "network", "APIM API 게이트웨이"],
            ["ri-stack-line", "Service Bus", "integration", "메시지 큐 토픽"],
            ["ri-broadcast-line", "Event Grid", "integration", "이벤트 라우팅"],
            ["ri-sparkling-2-line", "Microsoft Foundry", "ai", "AI 앱 에이전트 팩토리"],
            ["ri-brain-line", "Foundry Models", "ai", "모델 카탈로그 생성형 AI"],
            ["ri-robot-2-line", "Foundry Agent Service", "ai", "AI 에이전트"],
            ["ri-search-line", "Azure AI Search", "ai", "RAG 벡터 검색"],
            ["ri-user-line", "Microsoft Entra ID", "security", "ID 자격 증명 인증"],
            ["ri-lock-line", "Key Vault", "security", "키 비밀 인증서"],
            ["ri-shield-line", "Defender for Cloud", "security", "클라우드 보안 태세"],
            ["ri-line-chart-line", "Azure Monitor", "security", "모니터링 로그 메트릭"]
        ]),
        ...iconCategoryItems("infra", [
            ["ri-ship-line", "Docker"], ["ri-settings-3-line", "Kubernetes"], ["ri-server-line", "Nginx"],
            ["ri-global-line", "Traefik"], ["ri-git-branch-line", "Ingress"], ["ri-database-line", "Redis"],
            ["ri-database-2-line", "PostgreSQL"], ["ri-database-2-line", "MySQL"], ["ri-database-line", "MongoDB"],
            ["ri-search-line", "Elasticsearch"], ["ri-search-line", "OpenSearch"], ["ri-stack-line", "Kafka"],
            ["ri-stack-line", "RabbitMQ"], ["ri-bubble-chart-line", "NATS"], ["ri-global-line", "CDN"],
            ["ri-git-branch-line", "Load Balancer"], ["ri-global-line", "DNS"], ["ri-shield-line", "Firewall"],
            ["ri-shield-flash-line", "WAF"], ["ri-lock-line", "Vault"], ["ri-line-chart-line", "Prometheus"],
            ["ri-dashboard-3-line", "Grafana"], ["ri-file-list-line", "Loki"], ["ri-timer-line", "Jaeger"],
            ["ri-apps-line", "Registry"], ["ri-file-list-3-line", "Artifacts"], ["ri-hard-drive-line", "Backup"]
        ]),
        ...iconCategoryItems("modeling", [
            ["ri-square-line", "프로세스"], ["ri-diamond-line", "의사결정"], ["ri-circle-line", "시작/종료"],
            ["ri-file-text-line", "문서"], ["ri-git-branch-line", "입출력"], ["ri-stack-line", "서브프로세스"],
            ["ri-database-2-line", "데이터 저장소"], ["ri-text", "텍스트"]
        ])
    ];

    const getNodes = () => Array.from(diagramRoot.querySelectorAll("[data-diagram-node]"));

    const captureDiagramState = () => ({
        nodes: getNodes().map((node) => node.outerHTML),
        lines: linePaths.filter((line) => line.isConnected).map((line) => line.outerHTML),
        nodeCounter
    });

    const createLineFromMarkup = (markup) => {
        const parsed = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, "image/svg+xml");
        const source = parsed.querySelector("path");
        if (!source || source.localName !== "path") {
            return null;
        }

        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        Array.from(source.attributes).forEach((attribute) => {
            line.setAttribute(attribute.name, attribute.value);
        });
        line.classList.remove("diagram-line-selected", "diagram-line-hovered");
        return line;
    };

    const pushHistoryState = (state) => {
        if (isRestoringHistory) {
            return;
        }
        historyStack.push(state);
        if (historyStack.length > maxHistorySize) {
            historyStack.shift();
        }
    };

    const saveHistory = () => {
        pushHistoryState(captureDiagramState());
    };

    const restoreDiagramState = (state) => {
        if (!state) {
            return false;
        }

        isRestoringHistory = true;
        selectionFrame?.remove();
        selectionFrame = null;
        clearSelectedLine();
        selectedNodes = [];
        selectedNode = null;
        getNodes().forEach((node) => node.remove());
        diagramStage.querySelectorAll(".diagram-line-hit-path, .diagram-line-handles, [data-line-badge]").forEach((element) => element.remove());
        linePaths.forEach((line) => line.remove());
        linePaths = [];

        const svg = diagramStage.querySelector("svg");
        state.lines?.forEach((markup) => {
            if (!(svg instanceof SVGElement)) {
                return;
            }
            const line = createLineFromMarkup(markup);
            if (!line) {
                return;
            }
            svg.appendChild(line);
            linePaths.push(line);
            bindLineInteractions(line);
        });

        state.nodes.forEach((markup) => {
            const template = document.createElement("template");
            template.innerHTML = markup.trim();
            const node = template.content.firstElementChild;
            if (!(node instanceof HTMLElement)) {
                return;
            }
            node.dataset.bound = "false";
            node.classList.remove("diagram-node-selected", "diagram-node-grouped-highlight", "diagram-node-drawing");
            node.querySelectorAll("[data-line-connect-point]").forEach((point) => point.remove());
            diagramStage.appendChild(node);
            normalizeNodeIcon(node);
            bindNodeInteractions(node);
        });

        nodeCounter = state.nodeCounter;
        clearSelectedNode();
        updateLinePaths();
        isRestoringHistory = false;
        return true;
    };

    const undoLastHistory = () => {
        const previousState = historyStack.pop();
        return restoreDiagramState(previousState);
    };

    let propertyEditHistoryState = null;
    const beginPropertyEditHistory = () => {
        if (!selectedNode && !selectedLine) {
            return;
        }
        if (!propertyEditHistoryState) {
            propertyEditHistoryState = captureDiagramState();
            pushHistoryState(propertyEditHistoryState);
        }
    };

    const endPropertyEditHistory = () => {
        propertyEditHistoryState = null;
    };

    const selectedShapeInsertTool = () => selectedShapeTool;

    const selectedShapeButton = () => shapeMenuButtons.find((button) => button.dataset.shapeTool === selectedShapeTool);

    const selectedLinePresetButton = () => lineMenuButtons.find((button) => button.dataset.linePreset === selectedLinePreset) ?? lineMenuButtons[0];

    const applySelectedLinePreset = (line) => {
        const source = selectedLinePresetButton();
        const lineType = source?.dataset.lineTypePreset || "straight";
        line.dataset.lineType = lineType;
        line.dataset.lineStartArrow = source?.dataset.lineStartArrowPreset || "none";
        line.dataset.lineEndArrow = source?.dataset.lineEndArrowPreset || "triangle";
        line.dataset.lineDash = "solid";
        line.dataset.lineColor = line.dataset.lineColor || "#1E1E1E";
        line.dataset.lineAnimated = "false";
        line.dataset.lineControlX = lineType === "curve" ? "0" : (line.dataset.lineControlX || "0");
        line.dataset.lineControlY = lineType === "curve" ? "-80" : (line.dataset.lineControlY || "0");
    };

    const ensureLineTypeOptions = () => {
        if (lineTypeButtons.some((button) => button.dataset.lineType === "elbow")) {
            return;
        }
        const referenceButton = lineTypeButtons.find((button) => button.dataset.lineType === "straight") ?? lineTypeButtons[0];
        const container = referenceButton?.parentElement;
        if (!(container instanceof HTMLElement)) {
            return;
        }
        const button = document.createElement("button");
        button.className = referenceButton.className;
        button.dataset.lineType = "elbow";
        button.type = "button";
        button.textContent = "꺾은선";
        container.appendChild(button);
        lineTypeButtons = Array.from(diagramRoot.querySelectorAll("[data-line-type]"));
    };

    const syncShapeToolButton = () => {
        if (!(shapeToolButton instanceof HTMLElement)) {
            return;
        }
        const sourceIcon = selectedShapeButton()?.querySelector("svg");
        const label = selectedShapeButton()?.getAttribute("aria-label") || "Shape";
        if (sourceIcon instanceof SVGElement) {
            const icon = sourceIcon.cloneNode(true);
            icon.classList.add("w-5", "h-5");
            icon.setAttribute("aria-hidden", "true");
            shapeToolButton.replaceChildren(icon);
        }
        shapeToolButton.title = label;
        shapeToolButton.setAttribute("aria-label", label);
    };

    const setSpacesHidden = (hidden) => {
        spacesPanel.style.display = hidden ? "none" : "flex";
        spacesPanel.style.width = hidden ? "0px" : "280px";
        spacesPanel.style.opacity = hidden ? "0" : "1";
        spacesPanel.style.pointerEvents = hidden ? "none" : "auto";
        spacesPanel.classList.toggle("hidden", hidden);
        spacesPanel.classList.toggle("flex", !hidden);
        spacesPanel.classList.toggle("w-[280px]", !hidden);
        spacesPanel.classList.toggle("opacity-100", !hidden);
        spacesPanel.classList.toggle("pointer-events-auto", !hidden);
        spacesPanel.classList.toggle("bg-surface", !hidden);
        spacesPanel.classList.toggle("border-outline-variant", !hidden);
        spacesPanel.classList.toggle("w-0", hidden);
        spacesPanel.classList.toggle("opacity-0", hidden);
        spacesPanel.classList.toggle("pointer-events-none", hidden);
        spacesPanel.classList.toggle("bg-transparent", hidden);
        spacesPanel.classList.toggle("border-transparent", hidden);
        spacesTexts.forEach((element) => element.classList.toggle("hidden", hidden));
        spacesRows.forEach((element) => {
            element.classList.toggle("justify-center", hidden);
            element.classList.toggle("px-3", !hidden);
            element.classList.toggle("px-2", hidden);
        });
        spacesExpanders.forEach((element) => element.classList.toggle("hidden", hidden));
        if (spacesAction instanceof HTMLElement) {
            spacesAction.classList.toggle("hidden", hidden);
        }
        if (spacesHeader instanceof HTMLElement) {
            spacesHeader.classList.toggle("justify-between", !hidden);
            spacesHeader.classList.toggle("justify-center", hidden);
            spacesHeader.classList.toggle("px-4", !hidden);
            spacesHeader.classList.toggle("px-0", hidden);
        }
        if (spacesHeaderTitle instanceof HTMLElement) {
            spacesHeaderTitle.classList.toggle("hidden", hidden);
        }
        if (spacesHeaderExpander instanceof HTMLElement) {
            spacesHeaderExpander.classList.toggle("hidden", hidden);
        }
        if (spacesCollapsedIcon instanceof HTMLElement) {
            spacesCollapsedIcon.classList.toggle("hidden", true);
        }
        if (spacesScroll instanceof HTMLElement) {
            spacesScroll.classList.toggle("px-2", !hidden);
            spacesScroll.classList.toggle("px-1", hidden);
        }
        if (spacesFooter instanceof HTMLElement) {
            spacesFooter.classList.toggle("px-4", !hidden);
            spacesFooter.classList.toggle("px-2", hidden);
        }
        if (spacesOpenButton instanceof HTMLElement) {
            spacesOpenButton.classList.toggle("hidden", !hidden);
        }
        if (spacesToggleIcon instanceof HTMLElement) {
            spacesToggleIcon.textContent = "chevron_left";
        }
    };

    window.openDiagramSpaces = () => {
        setSpacesHidden(false);
    };

    spacesToggle?.addEventListener("click", () => {
        setSpacesHidden(true);
    });

    spacesOpenButton?.addEventListener("click", () => {
        setSpacesHidden(false);
    });

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        const clickedOpenButton = event.target.closest("#diagram-spaces-open");
        const clickedSidebarSpaces = event.target.closest("[data-open-diagram-spaces]");
        if (!clickedOpenButton && !clickedSidebarSpaces) {
            return;
        }

        const isDiagramPage = window.location.pathname.replace(/\/$/, "") === "/diagram";
        if (clickedSidebarSpaces && !isDiagramPage) {
            return;
        }

        event.preventDefault();
        setSpacesHidden(false);
    });

    setSpacesHidden(true);

    if (!zoomLayer || !diagramStage) {
        return;
    }

    const setActiveDiagramButton = (button) => {
        const diagramButtons = Array.from(diagramRoot.querySelectorAll("[data-space-diagram]"));
        diagramButtons.forEach((item) => {
            const isActive = item === button;
            item.classList.toggle("bg-secondary/10", isActive);
            item.classList.toggle("text-secondary", isActive);
            item.classList.toggle("text-on-surface-variant", !isActive);
        });
    };

    const bindDiagramButton = (button) => {
        button.addEventListener("click", () => {
            setActiveDiagramButton(button);
        });
    };

    const syncGroupState = (group, expanded) => {
        const children = group.querySelector("[data-spaces-children]");
        const expander = group.querySelector("[data-spaces-expander]");
        if (children instanceof HTMLElement) {
            children.classList.toggle("hidden", !expanded);
        }
        if (expander instanceof HTMLElement) {
            expander.classList.toggle("-rotate-90", !expanded);
        }
        group.dataset.groupExpanded = expanded ? "true" : "false";
    };

    const createDiagramButton = (name, isActive) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.spaceDiagram = "";
        button.className = "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg font-body-md text-body-md text-left transition-colors";
        button.innerHTML = `
            <span class="material-symbols-outlined text-[16px]">account_tree</span>
            <span class="truncate" data-spaces-text>${name}</span>
        `;
        bindDiagramButton(button);
        if (isActive) {
            setActiveDiagramButton(button);
        } else {
            button.classList.add("text-on-surface-variant", "hover:bg-surface-variant/50");
        }
        return button;
    };

    const bindGroupInteractions = (group) => {
        if (group.dataset.bound === "true") {
            return;
        }
        group.dataset.bound = "true";

        const toggleButton = group.querySelector("[data-group-toggle]");
        const addDiagramButton = group.querySelector("[data-group-add-diagram]");
        const children = group.querySelector("[data-spaces-children]");
        const expanded = group.dataset.groupExpanded !== "false";

        syncGroupState(group, expanded);

        toggleButton?.addEventListener("click", () => {
            const nextExpanded = group.dataset.groupExpanded !== "true";
            syncGroupState(group, nextExpanded);
        });

        addDiagramButton?.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!(children instanceof HTMLElement)) {
                return;
            }

            const groupName = group.querySelector("[data-group-name]")?.textContent?.trim() || `Group ${groupCounter}`;
            const newButton = createDiagramButton(`${groupName} Diagram ${diagramCounter++}`, true);
            newButton.classList.remove("text-on-surface-variant", "hover:bg-surface-variant/50");
            children.appendChild(newButton);
            syncGroupState(group, true);
        });

        Array.from(group.querySelectorAll("[data-space-diagram]")).forEach(bindDiagramButton);
    };

    const applyScale = () => {
        diagramStage.style.transform = `translate(calc(-50% + ${stagePanX}px), calc(-50% + ${stagePanY}px)) scale(${currentScale})`;
        if (zoomValue) {
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
        }
    };

    const syncToolButtons = () => {
        toolButtons.forEach((button) => {
            const isActive = button.dataset.diagramTool === activeTool
                || (isTemporaryMoveActive && button.dataset.diagramTool === "move");
            button.classList.toggle("text-secondary", isActive);
            button.classList.toggle("bg-secondary/10", isActive);
            button.classList.toggle("text-on-surface-variant", !isActive);
        });
        zoomLayer.style.cursor = activeTool === "move" ? "grab" : (activeTool === "select" ? "default" : "copy");
    };

    const isSelectionTool = () => activeTool === "select";
    const isCanvasMoveTool = () => activeTool === "move";
    const isConnectorTool = () => activeTool === "connector";

    const closeIconPicker = ({ restore = true } = {}) => {
        if (restore && iconLibraryNode && originalIconSnapshot) {
            const iconElement = ensureNodeIconElement(iconLibraryNode);
            if (iconElement) {
                setIconGlyph(iconElement, originalIconSnapshot.icon.set, originalIconSnapshot.icon.name);
                iconElement.classList.toggle("hidden", originalIconSnapshot.hidden);
                iconElement.style.color = originalIconSnapshot.inlineColor;
                const iconWrap = getNodeIconWrap(iconLibraryNode, iconElement);
                iconWrap?.classList.toggle("hidden", originalIconSnapshot.wrapperHidden);
            }
        }
        iconLibraryPanel?.classList.remove("is-open");
        iconLibraryPanel?.classList.add("hidden");
        iconPickerTrigger?.setAttribute("aria-expanded", "false");
        iconLibraryNode = null;
        draftIcon = null;
        originalIconSnapshot = null;
        iconColorModeTouched = false;
    };

    const setIconGlyph = (element, iconSet, iconName) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }
        element.classList.remove("material-symbols-outlined");
        element.classList.remove("diagram-remix-icon");
        Array.from(element.classList)
            .filter((className) => className.startsWith("ri-"))
            .forEach((className) => element.classList.remove(className));
        if (iconSet === "remix" && iconName) {
            element.classList.add(iconName);
            element.classList.add("diagram-remix-icon");
            element.dataset.remixIconName = iconName;
            element.textContent = "";
        } else {
            delete element.dataset.remixIconName;
            element.classList.add("material-symbols-outlined");
            element.textContent = iconName || "block";
        }
    };

    const normalizeNodeIcon = (node) => {
        let iconElement = node.querySelector("[data-node-icon-element]");
        if (!(iconElement instanceof HTMLElement) && node.dataset.nodeKind !== "shape") {
            iconElement = node.querySelector(".material-symbols-outlined");
            if (iconElement instanceof HTMLElement) {
                iconElement.dataset.nodeIconElement = "";
            }
        }

        if (node.dataset.nodeIcon === undefined) {
            const remixClass = iconElement instanceof HTMLElement
                ? Array.from(iconElement.classList).find((className) => className.startsWith("ri-"))
                : "";
            node.dataset.nodeIcon = remixClass || iconElement?.textContent?.trim() || "";
            node.dataset.nodeIconSet = remixClass ? "remix" : "material";
        }
        node.dataset.nodeIconSet = node.dataset.nodeIconSet || (node.dataset.nodeIcon.startsWith("ri-") ? "remix" : "material");
        node.dataset.nodeIconLabel = node.dataset.nodeIconLabel || node.dataset.nodeIcon || "아이콘 없음";
        return node.dataset.nodeIcon;
    };

    const ensureNodeIconElement = (node) => {
        let iconElement = node.querySelector("[data-node-icon-element]");
        if (iconElement instanceof HTMLElement) {
            return iconElement;
        }
        if (node.dataset.nodeKind !== "shape") {
            return null;
        }

        iconElement = document.createElement("span");
        iconElement.className = "material-symbols-outlined diagram-shape-icon";
        iconElement.dataset.nodeIconElement = "";
        node.prepend(iconElement);
        return iconElement;
    };

    const getNodeIconWrap = (node, iconElement = ensureNodeIconElement(node)) => {
        if (!(iconElement instanceof HTMLElement)) {
            return null;
        }
        const explicitWrap = iconElement.closest("[data-node-icon-wrap]");
        if (explicitWrap instanceof HTMLElement) {
            return explicitWrap;
        }
        const parent = iconElement.parentElement;
        if (parent && parent !== node && parent.children.length === 1) {
            parent.dataset.nodeIconWrap = "";
            return parent;
        }
        return null;
    };

    const ensureShapeContent = (node) => {
        if (node.dataset.nodeKind !== "shape") {
            return;
        }
        const iconElement = ensureNodeIconElement(node);
        const titleElement = node.querySelector("[data-node-title]");
        const subtitleElement = node.querySelector("[data-node-subtitle]");
        let contentElement = node.querySelector(".diagram-shape-content");
        if (!(contentElement instanceof HTMLElement)) {
            contentElement = document.createElement("div");
            contentElement.className = "diagram-shape-content";
            node.appendChild(contentElement);
        }
        [iconElement, titleElement, subtitleElement].forEach((element) => {
            if (element instanceof HTMLElement) {
                contentElement.appendChild(element);
            }
        });
        titleElement?.classList.remove("hidden");
        titleElement?.classList.add("diagram-shape-title");
        subtitleElement?.classList.remove("hidden");
        subtitleElement?.classList.add("diagram-shape-subtitle");
    };

    const syncShapeClass = (node) => {
        if (node.dataset.nodeKind !== "shape") {
            return;
        }
        const shapeType = shapeTools.includes(node.dataset.shapeType)
            ? node.dataset.shapeType
            : "rectangle";
        node.dataset.shapeType = shapeType;
        shapeTools.forEach((tool) => node.classList.remove(`diagram-shape-${tool}`));
        node.classList.add(`diagram-shape-${shapeType}`);
    };

    const nodeIconState = (node) => {
        const name = normalizeNodeIcon(node);
        const catalogIcon = diagramIcons.find((icon) => icon.category === node.dataset.nodeIconCategory
            && icon.name === name
            && icon.label === node.dataset.nodeIconLabel);
        const iconElement = ensureNodeIconElement(node);
        const computedColor = iconElement instanceof HTMLElement ? getComputedStyle(iconElement).color : "#45464D";
        const strokeColor = node.dataset.strokeColor;
        const inheritColor = node.dataset.textColor
            || (strokeColor && strokeColor !== "transparent" && strokeColor.toUpperCase() !== "#C6C6CD" ? strokeColor : "")
            || computedColor
            || "#45464D";
        const originalColor = node.dataset.nodeIconOriginalColor || catalogIcon?.color || inheritColor;
        return {
            category: node.dataset.nodeIconCategory || "default",
            set: name ? (node.dataset.nodeIconSet || "material") : "none",
            name,
            label: node.dataset.nodeIconLabel || name || "아이콘 없음",
            colorMode: node.dataset.nodeIconColorMode === "inherit"
                ? "default"
                : (node.dataset.nodeIconColorMode || "default"),
            originalColor,
            customColor: node.dataset.nodeIconColor || catalogIcon?.color || "#006399",
            inheritColor
        };
    };

    const resolveIconColor = (icon) => {
        if (icon.colorMode === "custom") {
            return icon.customColor;
        }
        if (icon.colorMode === "original") {
            return icon.originalColor;
        }
        return "#45464D";
    };

    const previewNodeIcon = (node, icon) => {
        const iconElement = ensureNodeIconElement(node);
        if (!iconElement) {
            return;
        }
        setIconGlyph(iconElement, icon.set, icon.name);
        iconElement.classList.toggle("hidden", !icon.name);
        iconElement.style.color = icon.colorMode === "default" ? "" : resolveIconColor(icon);
        getNodeIconWrap(node, iconElement)?.classList.toggle("hidden", !icon.name);
    };

    const syncCurrentIconControls = (icon) => {
        setIconGlyph(currentIconPreview, icon.set, icon.name);
        if (currentIconPreview instanceof HTMLElement) {
            currentIconPreview.style.color = resolveIconColor(icon);
        }
        if (currentIconLabel) {
            currentIconLabel.textContent = icon.label;
        }
    };

    const syncDraftIconControls = () => {
        if (!draftIcon) {
            return;
        }
        setIconGlyph(draftIconPreview, draftIcon.set, draftIcon.name);
        if (draftIconPreview instanceof HTMLElement) {
            draftIconPreview.style.color = resolveIconColor(draftIcon);
        }
        if (draftIconLabel) {
            draftIconLabel.textContent = draftIcon.label;
        }
        const colorModeLabels = { default: "단색", original: "도형 컬러", custom: "커스텀" };
        const colorModeHelp = {
            default: "서비스 색상 없이 노드의 기본 아이콘 색상을 사용합니다.",
            original: "서비스 제공사와 도형 카탈로그의 대표색을 사용합니다.",
            custom: "선택한 사용자 색상을 아이콘에 적용합니다."
        };
        if (iconColorValue) {
            iconColorValue.textContent = draftIcon.colorMode === "default"
                ? "단색 · 노드 기본값"
                : `${colorModeLabels[draftIcon.colorMode]} · ${resolveIconColor(draftIcon).toUpperCase()}`;
        }
        if (iconColorHelp) {
            iconColorHelp.textContent = colorModeHelp[draftIcon.colorMode];
        }
        iconColorModeButtons.forEach((button) => {
            const isActive = button.dataset.iconColorMode === draftIcon.colorMode;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-checked", String(isActive));
        });
        iconCustomColors?.classList.toggle("hidden", draftIcon.colorMode !== "custom");
        if (iconCustomColorPicker instanceof HTMLInputElement) {
            iconCustomColorPicker.value = draftIcon.customColor;
        }
        iconCustomColorButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.iconCustomColor?.toUpperCase() === draftIcon.customColor.toUpperCase());
        });
    };

    const renderIconServiceGroups = () => {
        if (!(iconServiceGroups instanceof HTMLElement)) {
            return;
        }

        const isCloudCategory = cloudIconCategories.includes(activeIconCategory);
        iconServiceGroups.classList.toggle("hidden", !isCloudCategory);
        iconServiceGroups.replaceChildren();
        if (!isCloudCategory) {
            activeIconGroup = "all";
            return;
        }

        const availableGroups = [...new Set(diagramIcons
            .filter((icon) => icon.category === activeIconCategory)
            .map((icon) => icon.group))];
        [{ value: "all", label: "전체 서비스" }, ...availableGroups.map((group) => ({
            value: group,
            label: iconGroupLabels[group] || group
        }))].forEach(({ value, label }) => {
            const button = document.createElement("button");
            const isActive = value === activeIconGroup;
            button.type = "button";
            button.dataset.iconGroup = value;
            button.className = isActive ? "active" : "";
            button.setAttribute("aria-pressed", String(isActive));
            button.textContent = label;
            iconServiceGroups.appendChild(button);
        });
    };

    const renderIconOptions = (query = "") => {
        if (!(iconGrid instanceof HTMLElement)) {
            return;
        }

        const normalizedQuery = query.trim().toLocaleLowerCase();
        const matches = diagramIcons.map((icon, index) => ({ icon, index })).filter(({ icon }) => {
            const searchable = `${icon.name} ${icon.label} ${icon.keywords}`.toLocaleLowerCase();
            const matchesCategory = activeIconCategory === "all" || icon.category === activeIconCategory;
            const matchesGroup = activeIconGroup === "all" || icon.group === activeIconGroup;
            return matchesCategory && matchesGroup && (!normalizedQuery || searchable.includes(normalizedQuery));
        });

        iconGrid.replaceChildren();
        matches.forEach(({ icon, index }) => {
            const button = document.createElement("button");
            const symbol = document.createElement(icon.set === "remix" ? "i" : "span");
            const label = document.createElement("span");
            button.type = "button";
            button.className = "diagram-icon-option";
            button.dataset.iconIndex = String(index);
            button.setAttribute("aria-label", icon.label);
            button.setAttribute("aria-selected", String(Boolean(draftIcon)
                && icon.category === draftIcon.category
                && icon.set === draftIcon.set
                && icon.name === draftIcon.name
                && icon.label === draftIcon.label));
            button.setAttribute("role", "option");
            button.title = icon.label;
            setIconGlyph(symbol, icon.set, icon.name);
            symbol.style.color = icon.color;
            label.className = "diagram-icon-option-label";
            label.textContent = icon.label;
            button.append(symbol, label);
            iconGrid.appendChild(button);
        });
        iconEmpty?.classList.toggle("hidden", matches.length > 0);
    };

    const setNodeIcon = (node, icon) => {
        node.dataset.nodeIcon = icon.name;
        node.dataset.nodeIconSet = icon.set;
        node.dataset.nodeIconLabel = icon.label;
        node.dataset.nodeIconCategory = icon.category;
        node.dataset.nodeIconColorMode = icon.colorMode;
        node.dataset.nodeIconOriginalColor = icon.originalColor;
        node.dataset.nodeIconColor = icon.customColor;
        previewNodeIcon(node, icon);
        syncCurrentIconControls(icon);
    };

    const applyNodeIconPosition = (node) => {
        if (node.dataset.nodeKind === "shape" || node.dataset.nodeKind === "group-box") {
            return;
        }
        const position = node.dataset.nodeIconPosition === "left" ? "left" : "top";
        const iconElement = ensureNodeIconElement(node);
        const iconWrap = getNodeIconWrap(node, iconElement);
        const titleElement = node.querySelector("[data-node-title]");
        const subtitleElement = node.querySelector("[data-node-subtitle]");
        node.classList.toggle("diagram-node-icon-left", position === "left");
        node.classList.toggle("diagram-node-icon-top", position !== "left");
        iconWrap?.classList.toggle("mb-1", position !== "left");
        titleElement?.classList.toggle("text-center", position !== "left");
        subtitleElement?.classList.toggle("text-center", position !== "left");
    };

    const setPropertiesPanelVisible = (visible) => {
        if (!(propertiesPanel instanceof HTMLElement)) {
            return;
        }

        propertiesPanel.classList.toggle("w-[300px]", visible);
        propertiesPanel.classList.toggle("opacity-100", visible);
        propertiesPanel.classList.toggle("pointer-events-auto", visible);
        propertiesPanel.classList.toggle("flex", visible);
        propertiesPanel.classList.toggle("hidden", !visible);
        propertiesPanel.classList.toggle("w-0", !visible);
        propertiesPanel.classList.toggle("opacity-0", !visible);
        propertiesPanel.classList.toggle("pointer-events-none", !visible);
        if (!visible) {
            closeIconPicker();
        }
    };

    const setActivePropertyTab = (tabName) => {
        propertyTabs.forEach((button) => {
            const isActive = button.dataset.propertyTab === tabName;
            button.classList.toggle("diagram-property-tab-active", isActive);
        });
        propertyPanels.forEach((panel) => {
            panel.classList.toggle("hidden", panel.dataset.propertyPanel !== tabName);
        });
        if (tabName === "icon") {
            if (selectedNode && iconLibraryPanel?.classList.contains("hidden")) {
                openIconPicker();
            }
        } else {
            closeIconPicker();
        }
    };

    const syncNodeBadge = (node) => {
        const badgeText = (node.dataset.nodeBadgeText ?? "").trim();
        const badgePosition = node.dataset.nodeBadgePosition ?? "right";
        const badgeColor = node.dataset.nodeBadgeColor ?? "#006399";
        let badge = node.querySelector("[data-node-badge]");

        if (!badgeText) {
            badge?.remove();
            return;
        }

        if (!(badge instanceof HTMLElement)) {
            badge = document.createElement("div");
            badge.dataset.nodeBadge = "";
            node.appendChild(badge);
        }

        badge.textContent = badgeText;
        badge.className = logic.badgeClassName(badgePosition);
        badge.style.backgroundColor = badgeColor;
        badge.style.boxShadow = `0 6px 14px ${badgeColor}38`;
    };

    const applyNodeTextAppearance = (node) => {
        const textColor = node.dataset.textColor ?? "";
        const textFontFamily = node.dataset.textFontFamily ?? "";
        const textFontSize = node.dataset.textFontSize ?? "";
        node.querySelectorAll("[data-node-title]").forEach((element) => {
            if (!(element instanceof HTMLElement)) {
                return;
            }
            element.style.color = textColor;
            element.style.fontFamily = textFontFamily;
            element.style.fontSize = textFontSize ? `${textFontSize}px` : "";
        });
    };

    const updateSelectionPanel = (node) => {
        const title = node.querySelector("[data-node-title]")?.textContent?.trim() ?? "";
        const badgeText = node.dataset.nodeBadgeText ?? "";
        const badgePosition = node.dataset.nodeBadgePosition ?? "right";
        const badgeColor = node.dataset.nodeBadgeColor ?? "#006399";
        const textColor = node.dataset.textColor ?? "";
        const textFontFamily = node.dataset.textFontFamily ?? "";
        const textFontSize = node.dataset.textFontSize ?? "20";
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeColor = node.dataset.strokeColor ?? "#C6C6CD";
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const nodeOpacity = node.dataset.nodeOpacity ?? "100";
        const nodeKind = node.dataset.nodeKind ?? "node";
        const icon = nodeIconState(node);
        const panelTypeLabel = nodeKind === "group-box" ? "Selected Group" : "Selected Node";
        const panelIcon = icon.name
            ? icon
            : { category: "default", set: "material", name: nodeKind === "group-box" ? "" : "block", label: "아이콘 없음" };
        if (selectedNodeName) {
            selectedNodeName.textContent = title;
        }
        if (selectedNodeType) {
            selectedNodeType.textContent = panelTypeLabel;
        }
        if (selectedNodeIcon) {
            setIconGlyph(selectedNodeIcon, panelIcon.set, panelIcon.name);
            selectedNodeIcon.style.color = resolveIconColor(icon);
        }
        syncCurrentIconControls(icon);
        if (selectedNodeIconWrap) {
            selectedNodeIconWrap.classList.toggle("bg-secondary-fixed", nodeKind !== "group-box");
            selectedNodeIconWrap.classList.toggle("text-secondary", nodeKind !== "group-box");
            selectedNodeIconWrap.classList.toggle("bg-accent-db/10", nodeKind === "group-box");
            selectedNodeIconWrap.classList.toggle("text-accent-db", nodeKind === "group-box");
        }
        iconPositionButtons.forEach((button) => {
            const isActive = button.dataset.iconPosition === (node.dataset.nodeIconPosition || "top");
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        if (nodeLabelInput) {
            nodeLabelInput.value = title;
        }
        if (nodeBadgeInput) {
            nodeBadgeInput.value = badgeText;
        }
        if (badgeColorValue) {
            badgeColorValue.textContent = badgeColor;
        }
        if (badgeColorPicker instanceof HTMLInputElement) {
            badgeColorPicker.value = badgeColor;
        }
        badgePositionButtons.forEach((button) => {
            const isActive = button.dataset.badgePosition === badgePosition;
            button.classList.toggle("diagram-align-button-active", isActive);
        });
        badgeColorButtons.forEach((button) => {
            const isActive = button.dataset.badgeColor === badgeColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        if (textColorValue) {
            textColorValue.textContent = textColor || "Default";
        }
        if (textColorPicker instanceof HTMLInputElement && textColor) {
            textColorPicker.value = textColor;
        }
        if (textFontFamilyInput instanceof HTMLSelectElement) {
            textFontFamilyInput.value = textFontFamily;
            textFontFamilyInput.style.fontFamily = textFontFamily;
        }
        if (textFontSizeInput instanceof HTMLInputElement) {
            textFontSizeInput.value = textFontSize;
        }
        if (textFontSizeValue) {
            textFontSizeValue.textContent = `${textFontSize}px`;
        }
        textColorButtons.forEach((button) => {
            const isActive = (button.dataset.textColor ?? "") === textColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        if (fillColorValue) {
            fillColorValue.textContent = fillColor;
        }
        if (fillColorPicker instanceof HTMLInputElement && fillColor !== "transparent") {
            fillColorPicker.value = fillColor;
        }
        if (strokeColorValue) {
            strokeColorValue.textContent = strokeColor;
        }
        if (strokeColorPicker instanceof HTMLInputElement && strokeColor !== "transparent") {
            strokeColorPicker.value = strokeColor;
        }
        if (strokeWidthInput) {
            strokeWidthInput.value = strokeWidth;
        }
        if (strokeWidthValue) {
            strokeWidthValue.textContent = `${strokeWidth}px`;
        }
        if (nodeOpacityInput instanceof HTMLInputElement) {
            nodeOpacityInput.value = nodeOpacity;
        }
        if (nodeOpacityValue) {
            nodeOpacityValue.textContent = `${nodeOpacity}%`;
        }
        fillColorButtons.forEach((button) => {
            const isActive = button.dataset.fillColor === fillColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        strokeColorButtons.forEach((button) => {
            const isActive = button.dataset.strokeColor === strokeColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        strokeStyleButtons.forEach((button) => {
            const isActive = button.dataset.strokeStyle === strokeStyle;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
        });
    };

    const syncGroupedNodeHighlights = (node) => {
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        const groups = selectedNodes.filter((item) => item.dataset.nodeKind === "group-box");
        if (!groups.length && node.dataset.nodeKind !== "group-box") {
            return;
        }

        const targets = groups.length ? groups : [node];
        targets.forEach((groupNode) => {
            getGroupedChildNodes(groupNode).forEach((item) => {
                item.classList.add("diagram-node-grouped-highlight");
            });
        });
    };

    const lineDashValue = (style) => {
        if (style === "small") return "3 4";
        if (style === "large") return "2 10";
        return "";
    };

    const lineArrowMarker = (arrow) => {
        if (arrow === "stealth") return "url(#arrow-line-stealth)";
        if (arrow === "diamond") return "url(#arrow-line-diamond)";
        if (arrow === "circle") return "url(#arrow-line-circle)";
        if (arrow === "triangle") return "url(#arrow-line-triangle)";
        return "";
    };

    const syncLineBadge = (line, point) => {
        const badgeText = (line.dataset.lineBadgeText ?? "").trim();
        const badgeColor = line.dataset.lineBadgeColor ?? "#006399";
        let badge = lineBadges.get(line);

        if (!badgeText) {
            badge?.remove();
            lineBadges.delete(line);
            return;
        }

        if (!(badge instanceof HTMLElement)) {
            badge = document.createElement("div");
            badge.className = "diagram-line-badge";
            badge.dataset.lineBadge = "";
            diagramStage.appendChild(badge);
            lineBadges.set(line, badge);
        }

        badge.textContent = badgeText;
        const hasBackground = badgeColor !== "transparent";
        badge.style.backgroundColor = hasBackground ? badgeColor : "transparent";
        badge.style.borderColor = hasBackground ? "rgba(255, 255, 255, 0.84)" : "transparent";
        badge.style.boxShadow = hasBackground ? `0 6px 14px ${badgeColor}38` : "none";
        badge.style.color = hasBackground ? "#ffffff" : "#191c1e";
        badge.classList.toggle("diagram-line-badge-selected", line === selectedLine);
        badge.style.display = point ? "" : "none";
        if (point) {
            badge.style.left = `${point.x}px`;
            badge.style.top = `${point.y}px`;
        }
    };

    const applyLineAppearance = (line) => {
        const color = line.dataset.lineColor ?? line.getAttribute("stroke") ?? "#7C839B";
        const dash = line.dataset.lineDash ?? (line.getAttribute("stroke-dasharray") ? "small" : "solid");
        const animated = line.dataset.lineAnimated === "true";
        const startArrow = line.dataset.lineStartArrow ?? "none";
        const endArrow = line.dataset.lineEndArrow ?? (line.getAttribute("marker-end") ? "triangle" : "none");
        const animationDirection = line.dataset.lineAnimationDirection ?? "forward";
        line.dataset.lineColor = color;
        line.dataset.lineDash = dash;
        line.dataset.lineStartArrow = startArrow;
        line.dataset.lineEndArrow = endArrow;
        line.dataset.lineAnimationDirection = animationDirection;
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", color);
        const startMarker = lineArrowMarker(startArrow);
        const endMarker = lineArrowMarker(endArrow);
        if (startMarker) {
            line.setAttribute("marker-start", startMarker);
        } else {
            line.removeAttribute("marker-start");
        }
        if (endMarker) {
            line.setAttribute("marker-end", endMarker);
        } else {
            line.removeAttribute("marker-end");
        }
        if (lineDashValue(dash)) {
            line.setAttribute("stroke-dasharray", lineDashValue(dash));
        } else {
            line.removeAttribute("stroke-dasharray");
        }
        line.classList.add("diagram-line-path");
        line.classList.toggle("diagram-line-animated", animated && dash !== "solid");
        line.classList.toggle("diagram-line-animated-reverse", animated && dash !== "solid" && animationDirection === "backward");
        line.classList.toggle("diagram-line-selected", line === selectedLine);
    };

    const updateLineSelectionPanel = (line) => {
        const type = line.dataset.lineType ?? "curve";
        const dash = line.dataset.lineDash ?? (line.getAttribute("stroke-dasharray") ? "small" : "solid");
        const color = line.dataset.lineColor ?? line.getAttribute("stroke") ?? "#7C839B";
        const animated = line.dataset.lineAnimated === "true";
        const startArrow = line.dataset.lineStartArrow ?? "none";
        const endArrow = line.dataset.lineEndArrow ?? (line.getAttribute("marker-end") ? "triangle" : "none");
        const animationDirection = line.dataset.lineAnimationDirection ?? "forward";

        lineTypeButtons.forEach((button) => {
            const isActive = button.dataset.lineType === type;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
        });
        lineDashButtons.forEach((button) => {
            const isActive = button.dataset.lineDash === dash;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
        });
        lineColorButtons.forEach((button) => {
            const isActive = button.dataset.lineColor === color;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        if (lineColorValue) {
            lineColorValue.textContent = color;
        }
        if (lineColorPicker instanceof HTMLInputElement) {
            lineColorPicker.value = color;
        }
        if (lineAnimatedInput instanceof HTMLInputElement) {
            lineAnimatedInput.checked = animated;
        }
        if (lineBadgeInput instanceof HTMLInputElement) {
            lineBadgeInput.value = line.dataset.lineBadgeText ?? "";
        }
        const lineBadgeColor = line.dataset.lineBadgeColor ?? "#006399";
        if (lineBadgeColorValue) {
            lineBadgeColorValue.textContent = lineBadgeColor;
        }
        if (lineBadgeColorPicker instanceof HTMLInputElement) {
            lineBadgeColorPicker.value = lineBadgeColor;
        }
        lineBadgeColorButtons.forEach((button) => {
            const isActive = button.dataset.lineBadgeColor === lineBadgeColor;
            button.classList.toggle("border-2", isActive);
            button.classList.toggle("border-secondary", isActive);
            button.classList.toggle("border-outline-variant", !isActive);
            const icon = button.querySelector(".material-symbols-outlined, .ri-check-line");
            if (icon) {
                icon.classList.toggle("hidden", !isActive);
            }
        });
        lineStartArrowButtons.forEach((button) => {
            const isActive = button.dataset.lineStartArrow === startArrow;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
            button.classList.toggle("text-secondary", isActive);
        });
        lineEndArrowButtons.forEach((button) => {
            const isActive = button.dataset.lineEndArrow === endArrow;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
            button.classList.toggle("text-secondary", isActive);
        });
        lineMotionButtons.forEach((button) => {
            const motion = button.dataset.lineMotion;
            const direction = button.dataset.lineAnimationDirection;
            const isActive = motion === "none" ? !animated : animated && direction === animationDirection;
            button.classList.toggle("bg-surface-white", isActive);
            button.classList.toggle("shadow-sm", isActive);
            button.classList.toggle("text-secondary", isActive);
        });
    };

    const clearSelectedLine = () => {
        if (selectedLine) {
            lineBadges.get(selectedLine)?.classList.remove("diagram-line-badge-selected");
        }
        selectedLine?.ownerSVGElement?.style.removeProperty("z-index");
        selectedLine?.classList.remove("diagram-line-selected");
        selectedLine = null;
    };

    const bringSelectedLineControlsToFront = (line) => {
        const svg = line.ownerSVGElement;
        const hitPath = lineHitPaths.get(line);
        const handles = lineHandleGroups.get(line);
        if (!svg) {
            return;
        }
        svg.style.zIndex = "35";
        [line, hitPath, handles].forEach((element) => {
            if (element) {
                svg.appendChild(element);
            }
        });
    };

    const setPropertyTabsForSelection = (selectionType) => {
        propertyTabs.forEach((button) => {
            const isLineTab = button.dataset.propertyTab === "line";
            button.classList.toggle("hidden", selectionType === "line" ? !isLineTab : isLineTab);
        });
        if (propertyTabsContainer instanceof HTMLElement) {
            propertyTabsContainer.style.gridTemplateColumns = selectionType === "line"
                ? "minmax(0, 1fr)"
                : "repeat(4, minmax(0, 1fr))";
        }
    };

    const setSelectedNodes = (nodes) => {
        clearSelectedLine();
        setPropertyTabsForSelection("node");
        const uniqueNodes = nodes.filter((node, index, list) => list.indexOf(node) === index);
        if (iconLibraryNode && (uniqueNodes.length !== 1 || uniqueNodes[0] !== iconLibraryNode)) {
            closeIconPicker();
        }
        selectedNodes = uniqueNodes;
        selectedNode = uniqueNodes.length === 1 ? uniqueNodes[0] : null;

        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        uniqueNodes.forEach((item) => item.classList.add("diagram-node-selected"));
        getNodes().forEach(applyNodeAppearance);

        if (uniqueNodes.length === 1) {
            syncGroupedNodeHighlights(uniqueNodes[0]);
            updateSelectionPanel(uniqueNodes[0]);
            setActivePropertyTab(uniqueNodes[0].dataset.nodeKind === "shape" ? "shape" : "text");
            setPropertiesPanelVisible(true);
            syncSelectionFrame();
        } else {
            getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
            uniqueNodes
                .filter((item) => item.dataset.nodeKind === "group-box")
                .forEach((groupNode) => {
                    getGroupedChildNodes(groupNode).forEach((child) => {
                        child.classList.add("diagram-node-grouped-highlight");
                    });
                });
            setPropertiesPanelVisible(false);
            syncSelectionFrame();
        }
    };

    const setSelectedNode = (node) => {
        setSelectedNodes([node]);
    };

    const clearSelectedNode = () => {
        selectedNodes = [];
        selectedNode = null;
        clearSelectedLine();
        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        getNodes().forEach(applyNodeAppearance);
        syncSelectionFrame();
        setPropertiesPanelVisible(false);
    };

    const setSelectedLine = (line) => {
        clearSelectedNode();
        selectedLine = line;
        bringSelectedLineControlsToFront(line);
        linePaths.forEach((path) => path.classList.toggle("diagram-line-selected", path === line));
        applyLineAppearance(line);
        updateLinePaths();
        updateLineSelectionPanel(line);
        if (selectedNodeType) {
            selectedNodeType.textContent = "Selected Line";
        }
        if (selectedNodeName) {
            selectedNodeName.textContent = `${line.dataset.lineFrom ?? ""} -> ${line.dataset.lineTo ?? ""}`;
        }
        setPropertyTabsForSelection("line");
        setActivePropertyTab("line");
        setPropertiesPanelVisible(true);
    };

    const clearLineConnectTargets = () => {
        getNodes().forEach((node) => {
            node.classList.remove("diagram-line-connect-target");
            node.querySelectorAll("[data-line-connect-point]").forEach((point) => point.remove());
        });
    };

    const showLineConnectPoints = (node, activeAnchor) => {
        node.classList.add("diagram-line-connect-target");
        ["top", "right", "bottom", "left"].forEach((anchor) => {
            let point = node.querySelector(`[data-line-connect-point="${anchor}"]`);
            if (!(point instanceof HTMLElement)) {
                point = document.createElement("span");
                point.className = "diagram-line-connect-point";
                point.dataset.lineConnectPoint = anchor;
                point.dataset.anchor = anchor;
                node.appendChild(point);
            }
            point.classList.toggle("diagram-line-connect-point-active", anchor === activeAnchor);
        });
    };

    const findNodeAtPoint = (point, excludedNodeKeys = []) => {
        const excludedKeys = Array.isArray(excludedNodeKeys) ? excludedNodeKeys : [excludedNodeKeys];
        const nodes = getNodes().filter((node) => !excludedKeys.includes(node.dataset.nodeKey));
        let closestAnchorTarget = null;
        let closestBoxTarget = null;
        for (let index = nodes.length - 1; index >= 0; index -= 1) {
            const node = nodes[index];
            const box = getNodeBox(node);
            const closestAnchor = getClosestAnchor(node, point);
            const closestAnchorPoint = getAnchorPoint(node, closestAnchor);
            const anchorDistance = Math.hypot(closestAnchorPoint.x - point.x, closestAnchorPoint.y - point.y);
            if (!closestAnchorTarget || anchorDistance < closestAnchorTarget.distance) {
                closestAnchorTarget = { node, distance: anchorDistance };
            }
            if (
                point.x >= box.x - lineConnectSnapPadding
                && point.x <= box.x + box.width + lineConnectSnapPadding
                && point.y >= box.y - lineConnectSnapPadding
                && point.y <= box.y + box.height + lineConnectSnapPadding
            ) {
                closestBoxTarget = node;
                break;
            }
        }
        if (closestBoxTarget) {
            return closestBoxTarget;
        }
        if (closestAnchorTarget?.distance <= lineConnectAnchorSnapRadius) {
            return closestAnchorTarget.node;
        }
        return null;
    };

    const getClosestAnchor = (node, point) => {
        return ["top", "right", "bottom", "left"].reduce((closest, anchor) => {
            const anchorPoint = getAnchorPoint(node, anchor);
            const distance = Math.hypot(anchorPoint.x - point.x, anchorPoint.y - point.y);
            return distance < closest.distance ? { anchor, distance } : closest;
        }, { anchor: "bottom", distance: Number.POSITIVE_INFINITY }).anchor;
    };

    const getClosestAnchorHit = (node, point) => {
        return ["top", "right", "bottom", "left"].reduce((closest, anchor) => {
            const anchorPoint = getAnchorPoint(node, anchor);
            const distance = Math.hypot(anchorPoint.x - point.x, anchorPoint.y - point.y);
            return distance < closest.distance ? { anchor, anchorPoint, distance } : closest;
        }, { anchor: "bottom", anchorPoint: getAnchorPoint(node, "bottom"), distance: Number.POSITIVE_INFINITY });
    };

    const deleteSelectedNodes = () => {
        if (selectedLine) {
            saveHistory();
            lineHitPaths.get(selectedLine)?.remove();
            lineHandleGroups.get(selectedLine)?.remove();
            lineBadges.get(selectedLine)?.remove();
            lineBadges.delete(selectedLine);
            selectedLine.remove();
            linePaths = linePaths.filter((line) => line !== selectedLine);
            clearSelectedNode();
            return true;
        }
        const nodesToDelete = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (!nodesToDelete.length) {
            return false;
        }

        saveHistory();
        const deletedKeys = new Set(nodesToDelete.map((node) => node.dataset.nodeKey).filter(Boolean));
        nodesToDelete.forEach((node) => node.remove());
        getNodes().forEach((node) => {
            if (deletedKeys.has(node.dataset.groupParent)) {
                delete node.dataset.groupParent;
                node.classList.remove("diagram-node-grouped-highlight");
            }
        });
        clearSelectedNode();
        updateLinePaths();
        return true;
    };

    const bindLineInteractions = (line) => {
        line.dataset.lineType = line.dataset.lineType ?? "curve";
        line.dataset.lineDash = line.dataset.lineDash ?? (line.getAttribute("stroke-dasharray") ? "small" : "solid");
        line.dataset.lineColor = line.dataset.lineColor ?? line.getAttribute("stroke") ?? "#7C839B";
        line.dataset.lineAnimated = line.dataset.lineAnimated ?? "false";
        line.dataset.lineStartArrow = line.dataset.lineStartArrow ?? "none";
        line.dataset.lineEndArrow = line.dataset.lineEndArrow ?? (line.getAttribute("marker-end") ? "triangle" : "none");
        line.dataset.lineAnimationDirection = line.dataset.lineAnimationDirection ?? "forward";
        line.dataset.lineBadgeText = line.dataset.lineBadgeText ?? "";
        line.dataset.lineBadgeColor = line.dataset.lineBadgeColor ?? "#006399";
        line.dataset.lineOffsetX = line.dataset.lineOffsetX ?? "0";
        line.dataset.lineOffsetY = line.dataset.lineOffsetY ?? "0";
        line.dataset.lineControlX = line.dataset.lineControlX ?? "0";
        line.dataset.lineControlY = line.dataset.lineControlY ?? "0";
        applyLineAppearance(line);
        const selectLine = (event) => {
            if (!isSelectionTool()) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setSelectedLine(line);
        };
        line.addEventListener("click", selectLine);
        line.addEventListener("mousedown", (event) => {
            if (!isSelectionTool()) {
                return;
            }
            selectLine(event);
            lineDrag = {
                line,
                mode: "move",
                start: getStagePoint(event),
                offsetX: Number(line.dataset.lineOffsetX ?? 0),
                offsetY: Number(line.dataset.lineOffsetY ?? 0),
                freeStartX: Number(line.dataset.freeStartX ?? 0),
                freeStartY: Number(line.dataset.freeStartY ?? 0),
                freeEndX: Number(line.dataset.freeEndX ?? 0),
                freeEndY: Number(line.dataset.freeEndY ?? 0),
                historyState: captureDiagramState(),
                changed: false
            };
            document.body.style.userSelect = "none";
        });

        const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        hitPath.classList.add("diagram-line-hit-path");
        hitPath.addEventListener("click", selectLine);
        hitPath.addEventListener("mousedown", (event) => {
            if (!isSelectionTool()) {
                return;
            }
            selectLine(event);
            lineDrag = {
                line,
                mode: "move",
                start: getStagePoint(event),
                offsetX: Number(line.dataset.lineOffsetX ?? 0),
                offsetY: Number(line.dataset.lineOffsetY ?? 0),
                freeStartX: Number(line.dataset.freeStartX ?? 0),
                freeStartY: Number(line.dataset.freeStartY ?? 0),
                freeEndX: Number(line.dataset.freeEndX ?? 0),
                freeEndY: Number(line.dataset.freeEndY ?? 0),
                historyState: captureDiagramState(),
                changed: false
            };
            document.body.style.userSelect = "none";
        });
        hitPath.addEventListener("mouseenter", () => line.classList.add("diagram-line-hovered"));
        hitPath.addEventListener("mouseleave", () => line.classList.remove("diagram-line-hovered"));
        line.addEventListener("mouseenter", () => line.classList.add("diagram-line-hovered"));
        line.addEventListener("mouseleave", () => line.classList.remove("diagram-line-hovered"));
        line.after(hitPath);
        lineHitPaths.set(line, hitPath);

        const handles = document.createElementNS("http://www.w3.org/2000/svg", "g");
        handles.classList.add("diagram-line-handles");
        handles.addEventListener("mouseenter", () => line.classList.add("diagram-line-hovered"));
        handles.addEventListener("mouseleave", () => line.classList.remove("diagram-line-hovered"));
        ["middle", "start", "end"].forEach((position) => {
            const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            handle.classList.add("diagram-line-handle", `diagram-line-handle--${position}`);
            handle.dataset.lineHandlePosition = position;
            handle.setAttribute("r", position === "middle" ? "7" : "8");
            handle.addEventListener("mousedown", (event) => {
                if (!isSelectionTool()) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                setSelectedLine(line);
                handles.appendChild(handle);
                const point = getStagePoint(event);
                lineDrag = {
                    line,
                    mode: position === "middle" ? "control" : `endpoint-${position}`,
                    start: point,
                    originNodeKey: position === "start" ? line.dataset.lineFrom : line.dataset.lineTo,
                    originAnchor: position === "start" ? (line.dataset.fromAnchor || "bottom") : (line.dataset.toAnchor || "top"),
                    oppositeNodeKey: position === "start" ? line.dataset.lineTo : line.dataset.lineFrom,
                    hasLeftOriginNode: position === "middle",
                    offsetX: Number(line.dataset.lineOffsetX ?? 0),
                    offsetY: Number(line.dataset.lineOffsetY ?? 0),
                    controlX: Number(line.dataset.lineControlX ?? 0),
                    controlY: Number(line.dataset.lineControlY ?? 0),
                    point,
                    pointerPoint: point,
                    targetNode: null,
                    historyState: captureDiagramState(),
                    changed: false
                };
                document.body.style.userSelect = "none";
            });
            handles.appendChild(handle);
        });
        hitPath.after(handles);
        lineHandleGroups.set(line, handles);
    };

    const applyNodeAppearance = (node) => {
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeColor = node.dataset.strokeColor ?? (node.dataset.nodeKind === "group-box" ? "#8FD5B7" : "#C6C6CD");
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const nodeOpacity = Math.max(0, Math.min(100, Number(node.dataset.nodeOpacity ?? "100")));
        const hasVisibleStroke = strokeColor !== "transparent" && Number(strokeWidth) > 0;
        const visibleFillColor = colorWithOpacity(fillColor, nodeOpacity);
        const visibleStrokeColor = hasVisibleStroke ? colorWithOpacity(strokeColor, nodeOpacity) : "transparent";

        node.style.setProperty("--diagram-node-fill-color", visibleFillColor);
        node.style.setProperty("--diagram-node-stroke-color", visibleStrokeColor);
        node.style.setProperty("--diagram-node-stroke-width", hasVisibleStroke ? `${strokeWidth}px` : "0px");
        const usesCssShape = node.dataset.nodeKind === "shape"
            && node.dataset.shapeType
            && !["rectangle", "rounded-rectangle", "ellipse", "circle"].includes(node.dataset.shapeType);
        if (usesCssShape) {
            node.style.backgroundColor = "transparent";
            node.style.borderWidth = "0px";
            node.style.borderColor = "transparent";
            node.style.borderStyle = "solid";
        } else {
            node.style.backgroundColor = visibleFillColor;
            node.style.borderWidth = hasVisibleStroke ? `${strokeWidth}px` : "0px";
            node.style.borderColor = visibleStrokeColor;
            node.style.borderStyle = hasVisibleStroke ? strokeStyle : "solid";
        }
        node.style.boxShadow = usesCssShape || !hasVisibleStroke || nodeOpacity <= 0 ? "none" : "";
        node.style.opacity = "";
    };

    const ensureResizeHandle = (node) => {
        node.querySelectorAll("[data-node-resize-handle]").forEach((handle) => handle.remove());
    };

    const getNodeRotation = (node) => Number(node.dataset.rotation ?? 0);

    const getAnchorPoint = (node, anchor) => {
        const left = node.offsetLeft;
        const top = node.offsetTop;
        const width = node.offsetWidth;
        const height = node.offsetHeight;

        const rotate = (point) => logic.rotatePoint(point, { x: left + width / 2, y: top + height / 2 }, getNodeRotation(node));
        switch (anchor) {
            case "left":
                return rotate({ x: left, y: top + height / 2 });
            case "right":
                return rotate({ x: left + width, y: top + height / 2 });
            case "top":
                return rotate({ x: left + width / 2, y: top });
            case "bottom":
            default:
                return rotate({ x: left + width / 2, y: top + height });
        }
    };

    const getGroupedChildNodes = (groupNode) => {
        return getNodes().filter((node) => {
            if (node === groupNode || node.dataset.nodeKind === "group-box") {
                return false;
            }
            return node.dataset.groupParent === groupNode.dataset.nodeKey;
        });
    };

    const isNodeInsideGroup = (node, groupNode) => {
        const groupLeft = groupNode.offsetLeft;
        const groupTop = groupNode.offsetTop;
        const groupRight = groupLeft + groupNode.offsetWidth;
        const groupBottom = groupTop + groupNode.offsetHeight;
        const centerX = node.offsetLeft + (node.offsetWidth / 2);
        const centerY = node.offsetTop + (node.offsetHeight / 2);

        return centerX >= groupLeft
            && centerX <= groupRight
            && centerY >= groupTop
            && centerY <= groupBottom;
    };

    const findContainingGroup = (node) => {
        const groups = getNodes().filter((item) => item.dataset.nodeKind === "group-box");
        for (let index = groups.length - 1; index >= 0; index -= 1) {
            if (isNodeInsideGroup(node, groups[index])) {
                return groups[index];
            }
        }
        return null;
    };

    const syncNodeGroupMembership = (node) => {
        if (node.dataset.nodeKind === "group-box") {
            return;
        }

        const containingGroup = findContainingGroup(node);
        if (containingGroup) {
            node.dataset.groupParent = containingGroup.dataset.nodeKey ?? "";
        } else {
            delete node.dataset.groupParent;
        }
    };

    const getStagePoint = (event) => {
        const stageRect = diagramStage.getBoundingClientRect();
        return {
            x: (event.clientX - stageRect.left) / currentScale,
            y: (event.clientY - stageRect.top) / currentScale
        };
    };

    const getNodeBox = (node) => ({
        x: node.offsetLeft,
        y: node.offsetTop,
        width: node.offsetWidth,
        height: node.offsetHeight
    });

    const normalizeBox = logic.normalizeBox;

    const isNodeInsideBox = (node, area) => {
        const box = getNodeBox(node);
        const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        return [[0, 0], [box.width, 0], [0, box.height], [box.width, box.height]].every(([x, y]) => {
            const point = logic.rotatePoint({ x: box.x + x, y: box.y + y }, center, getNodeRotation(node));
            return logic.isBoxInside({ ...point, width: 0, height: 0 }, area);
        });
    };

    const createSelectionBox = () => {
        const box = document.createElement("div");
        box.className = "diagram-selection-box";
        diagramStage.appendChild(box);
        return box;
    };

    const syncSelectionBox = (boxElement, area) => {
        boxElement.style.left = `${area.x}px`;
        boxElement.style.top = `${area.y}px`;
        boxElement.style.width = `${area.width}px`;
        boxElement.style.height = `${area.height}px`;
    };

    const moveNodesByDelta = (nodes, deltaX, deltaY) => {
        const targets = new Map();

        nodes.forEach((node) => {
            targets.set(node.dataset.nodeKey ?? String(targets.size), node);
            if (node.dataset.nodeKind === "group-box") {
                getGroupedChildNodes(node).forEach((child) => {
                    targets.set(child.dataset.nodeKey ?? String(targets.size), child);
                });
            }
        });

        Array.from(targets.values()).forEach((node) => {
            node.style.left = `${node.offsetLeft + deltaX}px`;
            node.style.top = `${node.offsetTop + deltaY}px`;
        });

        Array.from(targets.values()).forEach((node) => {
            if (node.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(node);
            }
        });

        updateLinePaths();
        syncSelectionFrame();
    };

    const moveNodeByDelta = (node, deltaX, deltaY) => {
        moveNodesByDelta([node], deltaX, deltaY);
    };

    const cloneNodeForClipboard = (node) => ({
        element: node.cloneNode(true),
        left: node.offsetLeft,
        top: node.offsetTop,
        nodeKey: node.dataset.nodeKey ?? "",
        groupParent: node.dataset.groupParent ?? ""
    });

    const copySelectedNodes = () => {
        const nodesToCopy = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (!nodesToCopy.length) {
            return false;
        }

        nodeClipboard = nodesToCopy.map(cloneNodeForClipboard);
        pasteOffset = 0;
        return true;
    };

    const preparePastedNode = (snapshot, keyMap, offset) => {
        const node = snapshot.element.cloneNode(true);
        const nextKey = keyMap.get(snapshot.nodeKey);

        node.dataset.nodeKey = nextKey ?? `generated-node-${++nodeCounter}`;
        node.dataset.bound = "false";
        node.classList.remove("diagram-node-selected", "diagram-node-grouped-highlight", "diagram-node-drawing");
        node.querySelectorAll("[data-line-connect-point]").forEach((point) => point.remove());
        node.style.left = `${snapshot.left + offset}px`;
        node.style.top = `${snapshot.top + offset}px`;
        if (snapshot.groupParent && keyMap.has(snapshot.groupParent)) {
            node.dataset.groupParent = keyMap.get(snapshot.groupParent);
        } else {
            delete node.dataset.groupParent;
        }

        return node;
    };

    const pasteCopiedNodes = () => {
        if (!nodeClipboard.length) {
            return false;
        }

        saveHistory();
        pasteOffset += 28;
        const keyMap = new Map();
        nodeClipboard.forEach((snapshot) => {
            const sourceKind = snapshot.element.dataset.nodeKind || "node";
            const sourceKey = snapshot.nodeKey || `${sourceKind}-${keyMap.size}`;
            keyMap.set(sourceKey, `generated-${sourceKind}-${++nodeCounter}`);
        });
        const pastedNodes = nodeClipboard.map((snapshot) => preparePastedNode(snapshot, keyMap, pasteOffset));

        pastedNodes.forEach((node) => {
            diagramStage.appendChild(node);
            bindNodeInteractions(node);
        });
        pastedNodes.forEach((node) => {
            if (node.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(node);
            }
        });

        setSelectedNodes(pastedNodes);
        updateLinePaths();
        return true;
    };

    const isTypingTarget = (target) => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }
        const tagName = target.tagName.toLowerCase();
        return tagName === "input" || tagName === "textarea" || target.isContentEditable;
    };

    const isCopyKeyEvent = (event) => {
        return (event.ctrlKey || event.metaKey) && (event.key?.toLowerCase() === "c" || event.code === "KeyC");
    };

    const isPasteKeyEvent = (event) => {
        return (event.ctrlKey || event.metaKey) && (event.key?.toLowerCase() === "v" || event.code === "KeyV");
    };

    const getNodeMinimumSize = (node) => {
        return logic.nodeMinimumSize(node.dataset.nodeKind, node.dataset.shapeType);
    };

    const resizeNodeFromCorner = (node, corner, startBox, currentPoint) => {
        const min = getNodeMinimumSize(node);
        const nextBox = logic.resizeRotatedBox(startBox, corner, currentPoint, min, {
            preserveAspect: node.dataset.shapeType === "circle" || node.dataset.shapeType === "diamond"
        }, getNodeRotation(node));

        node.style.left = `${nextBox.left}px`;
        node.style.top = `${nextBox.top}px`;
        node.style.width = `${nextBox.width}px`;
        node.style.height = `${nextBox.height}px`;
    };

    let isFrameResizing = false;
    let frameResizeCorner = "se";
    let frameResizeStartBox = null;
    let frameResizeHistoryState = null;
    let frameResizeChanged = false;
    let frameRotation = null;

    window.addEventListener("blur", () => {
        if (!frameRotation && !isFrameResizing && !lineDrag) return;
        frameRotation = null;
        isFrameResizing = false;
        lineDrag = null;
        clearLineConnectTargets();
        frameResizeStartBox = null;
        selectionFrame?.querySelector("[data-node-rotate-handle]")?.classList.remove("is-rotating");
        document.body.style.userSelect = "";
    });

    const getOrCreateSelectionFrame = () => {
        if (selectionFrame) {
            return selectionFrame;
        }

        const frame = document.createElement("div");
        frame.className = "diagram-node-selection-frame";
        frame.addEventListener("click", (event) => {
            suppressCanvasClick = false;
            event.stopPropagation();
        });
        const rotateHandle = document.createElement("button");
        rotateHandle.type = "button";
        rotateHandle.className = "diagram-node-rotate-handle";
        rotateHandle.dataset.nodeRotateHandle = "";
        rotateHandle.setAttribute("aria-label", "선택한 노드 회전");
        rotateHandle.title = "드래그하여 회전 (Shift: 15° 간격)";
        rotateHandle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">rotate_right</span>';
        rotateHandle.addEventListener("mousedown", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.button !== 0 || !isSelectionTool() || !selectedNode) return;
            const center = { x: selectedNode.offsetLeft + selectedNode.offsetWidth / 2, y: selectedNode.offsetTop + selectedNode.offsetHeight / 2 };
            const point = getStagePoint(event);
            frameRotation = {
                node: selectedNode,
                center,
                angle: Math.atan2(point.y - center.y, point.x - center.x),
                rotation: Number(selectedNode.dataset.rotation ?? 0),
                historyState: captureDiagramState(),
                changed: false
            };
            document.body.style.userSelect = "none";
            rotateHandle.classList.add("is-rotating");
        });
        frame.appendChild(rotateHandle);
        ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((corner) => {
            const handle = document.createElement("button");
            handle.type = "button";
            handle.dataset.nodeResizeHandle = corner;
            handle.className = `diagram-node-resize-handle diagram-node-resize-handle--${corner}`;
            handle.setAttribute("aria-label", `Resize selected node ${corner}`);
            handle.addEventListener("mousedown", (event) => {
                if (!isSelectionTool() || !selectedNode) {
                    return;
                }
                isFrameResizing = true;
                frameResizeCorner = corner;
                frameResizeStartBox = {
                    left: selectedNode.offsetLeft,
                    top: selectedNode.offsetTop,
                    width: selectedNode.offsetWidth,
                    height: selectedNode.offsetHeight
                };
                frameResizeHistoryState = captureDiagramState();
                frameResizeChanged = false;
                event.preventDefault();
                event.stopPropagation();
                document.body.style.userSelect = "none";
            });
            frame.appendChild(handle);
        });

        diagramStage.appendChild(frame);
        selectionFrame = frame;
        return frame;
    };

    const syncSelectionFrame = () => {
        if (!selectedNode || selectedNodes.length !== 1) {
            selectionFrame?.remove();
            selectionFrame = null;
            return;
        }

        const padding = 8;
        const frame = getOrCreateSelectionFrame();
        frame.style.left = `${selectedNode.offsetLeft - padding}px`;
        frame.style.top = `${selectedNode.offsetTop - padding}px`;
        frame.style.width = `${selectedNode.offsetWidth + padding * 2}px`;
        frame.style.height = `${selectedNode.offsetHeight + padding * 2}px`;
        frame.style.transform = `rotate(${getNodeRotation(selectedNode)}deg)`;
    };

    const updateLinePaths = () => {
        linePaths.forEach((path) => {
            const fromKey = path.dataset.lineFrom;
            const toKey = path.dataset.lineTo;
            const fromNode = diagramRoot.querySelector(`[data-node-key="${fromKey}"]`);
            const toNode = diagramRoot.querySelector(`[data-node-key="${toKey}"]`);
            const hitPath = lineHitPaths.get(path);
            const handleGroup = lineHandleGroups.get(path);
            const hasFreeStart = path.dataset.freeStartX !== undefined && path.dataset.freeStartY !== undefined;
            const hasFreeEnd = path.dataset.freeEndX !== undefined && path.dataset.freeEndY !== undefined;

            if ((!hasFreeStart && !(fromNode instanceof HTMLElement)) || (!hasFreeEnd && !(toNode instanceof HTMLElement))) {
                path.removeAttribute("d");
                path.style.display = "none";
                hitPath?.removeAttribute("d");
                if (hitPath) {
                    hitPath.style.display = "none";
                }
                if (handleGroup) {
                    handleGroup.style.display = "none";
                }
                syncLineBadge(path, null);
                return;
            }
            path.style.display = "";
            if (hitPath) {
                hitPath.style.display = "";
            }
            if (handleGroup) {
                handleGroup.style.display = "";
            }

            const lineOffsetX = Number(path.dataset.lineOffsetX ?? 0);
            const lineOffsetY = Number(path.dataset.lineOffsetY ?? 0);
            const baseStart = fromNode instanceof HTMLElement
                ? getAnchorPoint(fromNode, path.dataset.fromAnchor || "bottom")
                : { x: Number(path.dataset.freeStartX ?? 0), y: Number(path.dataset.freeStartY ?? 0) };
            const baseEnd = toNode instanceof HTMLElement
                ? getAnchorPoint(toNode, path.dataset.toAnchor || "top")
                : { x: Number(path.dataset.freeEndX ?? 0), y: Number(path.dataset.freeEndY ?? 0) };
            const start = hasFreeStart
                ? { x: Number(path.dataset.freeStartX), y: Number(path.dataset.freeStartY) }
                : { x: baseStart.x + lineOffsetX, y: baseStart.y + lineOffsetY };
            const end = hasFreeEnd
                ? { x: Number(path.dataset.freeEndX), y: Number(path.dataset.freeEndY) }
                : { x: baseEnd.x + lineOffsetX, y: baseEnd.y + lineOffsetY };
            if (lineDrag?.line === path && lineDrag.point) {
                if (lineDrag.mode === "endpoint-start") {
                    start.x = lineDrag.point.x;
                    start.y = lineDrag.point.y;
                }
                if (lineDrag.mode === "endpoint-end") {
                    end.x = lineDrag.point.x;
                    end.y = lineDrag.point.y;
                }
            }
            const deltaX = end.x - start.x;
            const deltaY = end.y - start.y;
            const middle = {
                x: start.x + deltaX / 2 + Number(path.dataset.lineControlX ?? 0),
                y: start.y + deltaY / 2 + Number(path.dataset.lineControlY ?? 0)
            };

            let pathValue = "";
            if (path.dataset.lineType === "straight") {
                pathValue = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
            } else if (path.dataset.lineType === "elbow") {
                pathValue = `M ${start.x} ${start.y} H ${middle.x} V ${end.y} H ${end.x}`;
            } else {
                const controlX = middle.x * 2 - (start.x + end.x) / 2;
                const controlY = middle.y * 2 - (start.y + end.y) / 2;
                pathValue = `M ${start.x} ${start.y} Q ${controlX} ${controlY}, ${end.x} ${end.y}`;
            }

            path.setAttribute("d", pathValue);
            hitPath?.setAttribute("d", pathValue);
            if (handleGroup) {
                const handlePoints = { start, middle, end };
                Array.from(handleGroup.querySelectorAll("circle")).forEach((handle) => {
                    const point = handlePoints[handle.dataset.lineHandlePosition];
                    if (!point) {
                        return;
                    }
                    handle.setAttribute("cx", String(point.x));
                    handle.setAttribute("cy", String(point.y));
                });
            }
            syncLineBadge(path, middle);
            applyLineAppearance(path);
        });
    };

    const bindNodeInteractions = (node) => {
        const element = node;
        if (element.dataset.bound === "true") {
            return;
        }
        element.dataset.bound = "true";
        syncShapeClass(element);
        ensureShapeContent(element);
        ensureResizeHandle(element);
        element.classList.remove("relative");
        element.style.left = `${element.offsetLeft}px`;
        element.style.top = `${element.offsetTop}px`;
        element.style.userSelect = "none";
        element.dataset.fillColor = element.dataset.fillColor ?? (element.dataset.nodeKey === "order-service" ? "#CDE5FF" : "#FFFFFF");
        element.dataset.strokeColor = element.dataset.strokeColor ?? (element.dataset.nodeKind === "group-box" ? "#8FD5B7" : "#C6C6CD");
        element.dataset.strokeWidth = element.dataset.strokeWidth ?? (element.dataset.nodeKey === "order-service" ? "2" : "1");
        element.dataset.strokeStyle = element.dataset.strokeStyle ?? "solid";
        element.dataset.nodeOpacity = element.dataset.nodeOpacity ?? "100";
        element.dataset.textColor = element.dataset.textColor ?? "";
        element.dataset.textFontFamily = element.dataset.textFontFamily ?? "";
        element.dataset.textFontSize = element.dataset.textFontSize ?? "20";
        element.dataset.nodeBadgeText = element.dataset.nodeBadgeText ?? (element.querySelector("[data-node-badge]")?.textContent?.trim() ?? "");
        element.dataset.nodeBadgePosition = element.dataset.nodeBadgePosition ?? "right";
        element.dataset.nodeBadgeColor = element.dataset.nodeBadgeColor ?? "#006399";
        syncNodeBadge(element);
        applyNodeTextAppearance(element);
        applyNodeAppearance(element);
        applyNodeIconPosition(element);
        syncNodeGroupMembership(element);

        element.addEventListener("pointerenter", (event) => {
            if (!isConnectorTool() || lineDrag || drawingLine) {
                return;
            }
            const point = getStagePoint(event);
            const anchorHit = getClosestAnchorHit(element, point);
            showLineConnectPoints(element, anchorHit.anchor);
        });

        element.addEventListener("pointermove", (event) => {
            if (!isConnectorTool() || lineDrag || drawingLine) {
                return;
            }
            const point = getStagePoint(event);
            const anchorHit = getClosestAnchorHit(element, point);
            showLineConnectPoints(element, anchorHit.anchor);
        });

        element.addEventListener("pointerleave", () => {
            if (!isConnectorTool() || lineDrag || drawingLine) {
                return;
            }
            clearLineConnectTargets();
        });

        element.addEventListener("click", (event) => {
            event.stopPropagation();
            if (skipClickSelection) {
                skipClickSelection = false;
                event.preventDefault();
                return;
            }
            if (hasDragged) {
                hasDragged = false;
                event.preventDefault();
                return;
            }
            setSelectedNode(element);
        });

        let isDragging = false;
        let hasDragged = false;
        let startX = 0;
        let startY = 0;
        let dragSnapshots = [];
        let skipClickSelection = false;
        let isAltMovingGroupOnly = false;
        let dragHistoryState = null;

        element.addEventListener("mousedown", (event) => {
            if (!isSelectionTool()) {
                return;
            }
            if (event.target instanceof HTMLElement && event.target.closest("[data-node-resize-handle]")) {
                return;
            }
            isDragging = true;
            hasDragged = false;
            const altGroupTarget = event.altKey
                ? (element.dataset.nodeKind === "group-box" ? element : findContainingGroup(element))
                : null;
            isAltMovingGroupOnly = altGroupTarget instanceof HTMLElement;
            startX = event.clientX;
            startY = event.clientY;
            dragHistoryState = captureDiagramState();

            if (event.shiftKey || event.ctrlKey || event.metaKey) {
                skipClickSelection = true;
                if (selectedNodes.includes(element)) {
                    setSelectedNodes(selectedNodes.filter((node) => node !== element));
                } else {
                    setSelectedNodes([...selectedNodes, element]);
                }
                isDragging = false;
                event.preventDefault();
                event.stopPropagation();
                return;
            } else if (isAltMovingGroupOnly) {
                setSelectedNode(altGroupTarget);
            } else if (!selectedNodes.includes(element)) {
                setSelectedNode(element);
            }

            dragSnapshots = (isAltMovingGroupOnly ? [altGroupTarget] : (selectedNodes.includes(element) ? selectedNodes : [element])).map((node) => ({
                element: node,
                initialLeft: node.offsetLeft,
                initialTop: node.offsetTop
            }));

            if (!isAltMovingGroupOnly) {
                selectedNodes
                    .filter((node) => node.dataset.nodeKind === "group-box")
                    .forEach((groupNode) => {
                        getGroupedChildNodes(groupNode).forEach((child) => {
                            if (!dragSnapshots.some((item) => item.element === child)) {
                                dragSnapshots.push({
                                    element: child,
                                    initialLeft: child.offsetLeft,
                                    initialTop: child.offsetTop
                                });
                            }
                        });
                    });

                if (element.dataset.nodeKind === "group-box" && !selectedNodes.includes(element)) {
                    getGroupedChildNodes(element).forEach((child) => {
                        if (!dragSnapshots.some((item) => item.element === child)) {
                            dragSnapshots.push({
                                element: child,
                                initialLeft: child.offsetLeft,
                                initialTop: child.offsetTop
                            });
                        }
                    });
                }
            }

            event.preventDefault();
            event.stopPropagation();
            document.body.style.userSelect = "none";
        });

        window.addEventListener("mousemove", (event) => {
            if (!isDragging) {
                return;
            }
            const deltaX = (event.clientX - startX) / currentScale;
            const deltaY = (event.clientY - startY) / currentScale;
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                hasDragged = true;
            }
            dragSnapshots.forEach((item) => {
                item.element.style.left = `${item.initialLeft + deltaX}px`;
                item.element.style.top = `${item.initialTop + deltaY}px`;
            });
            updateLinePaths();
            syncSelectionFrame();
        });

        window.addEventListener("mouseup", () => {
            if (isDragging && hasDragged && dragHistoryState) {
                pushHistoryState(dragHistoryState);
            }
            if (isDragging && dragSnapshots.length && !isAltMovingGroupOnly) {
                dragSnapshots.forEach((item) => {
                    if (item.element.dataset.nodeKind !== "group-box") {
                        syncNodeGroupMembership(item.element);
                    }
                });
            }
            isDragging = false;
            isAltMovingGroupOnly = false;
            document.body.style.userSelect = "";
            if (!hasDragged && element.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(element);
            }
            dragSnapshots = [];
            dragHistoryState = null;
            syncSelectionFrame();
        });
    };

    const shapeTools = [
        "rectangle", "rounded-rectangle", "ellipse", "circle", "triangle", "right-triangle", "diamond",
        "pentagon", "hexagon", "octagon", "plus", "heart", "lightning", "cloud", "document", "star",
        "gear", "speech", "database"
    ];
    const isShapeTool = (tool) => shapeTools.includes(tool);
    const drawingNodeTools = [...shapeTools, "shape", "group-box"];
    const isDrawingNodeTool = (tool) => drawingNodeTools.includes(tool);
    const insertNodeTools = [...shapeTools, "shape", "group-box", "text", "image", "node"];
    const isInsertNodeTool = (tool) => insertNodeTools.includes(tool);

    const createNodeMarkup = (tool) => {
        const node = document.createElement("div");
        node.dataset.diagramNode = "";
        node.dataset.nodeKey = `generated-${tool}-${++nodeCounter}`;

        if (isShapeTool(tool)) {
            const shapeLabels = {
                rectangle: "사각형",
                "rounded-rectangle": "둥근 사각형",
                ellipse: "타원",
                circle: "원",
                triangle: "삼각형",
                "right-triangle": "직각 삼각형",
                diamond: "마름모",
                pentagon: "오각형",
                hexagon: "육각형",
                octagon: "팔각형",
                plus: "플러스",
                heart: "하트",
                lightning: "번개",
                cloud: "구름",
                document: "문서",
                star: "별",
                gear: "태양",
                speech: "말풍선",
                database: "데이터베이스"
            };
            const title = shapeLabels[tool] ?? "도형";
            const shapeClass = tool === "cloud"
                ? `diagram-shape-${tool} w-32 h-20`
                : tool === "star"
                ? `diagram-shape-${tool} w-28 h-28`
                : ["circle", "diamond", "pentagon", "hexagon", "octagon", "plus", "heart", "lightning", "star", "gear"].includes(tool)
                ? `diagram-shape-${tool} w-32 h-32`
                : `diagram-shape-${tool} w-40 h-28`;

            node.dataset.nodeKind = "shape";
            node.dataset.shapeType = tool;
            node.dataset.nodeIcon = "";
            node.dataset.fillColor = "#FFFFFF";
            node.dataset.strokeColor = "#C6C6CD";
            node.dataset.strokeWidth = "2";
            node.dataset.strokeStyle = "solid";
            node.dataset.nodeOpacity = "100";
            node.dataset.textColor = "";
            node.dataset.textFontFamily = "";
            node.dataset.textFontSize = "20";
            node.className = `absolute ${shapeClass} bg-surface-white border border-outline-variant shadow-sm cursor-move z-10`;
            syncShapeClass(node);
            node.innerHTML = `
                <span class="material-symbols-outlined diagram-shape-icon hidden" data-node-icon-element></span>
                <span class="hidden" data-node-title>${title}</span>
                <span class="hidden" data-node-subtitle">Shape</span>
            `;
            return node;
        }

        let icon = "rectangle";
        let title = "Service Node";
        let subtitle = "New Component";
        let shapeClass = "rounded-xl";
        let widthClass = "w-48";
        let extraClass = "";

        if (tool === "text") {
            icon = "text_fields";
            title = "Text Block";
            subtitle = "Editable";
            widthClass = "w-56";
        } else if (tool === "image") {
            icon = "image";
            title = "Image Block";
            subtitle = "Placeholder";
            widthClass = "w-56";
        } else if (tool === "group-box") {
            title = "Group Box";
            subtitle = "Group Box";
            widthClass = "w-[700px]";
            shapeClass = "rounded-2xl";
            extraClass = "h-[180px] border-accent-db/20 bg-accent-db/5 border-dashed z-[9] items-start justify-start";
        }

        if (tool === "group-box") {
            node.dataset.nodeKind = "group-box";
            node.dataset.nodeIcon = "";
            node.dataset.nodeIconSet = "";
            node.dataset.fillColor = "rgba(16, 185, 129, 0.05)";
            node.dataset.strokeColor = "#8FD5B7";
            node.dataset.strokeWidth = "1";
            node.dataset.strokeStyle = "dashed";
            node.dataset.nodeOpacity = "100";
            node.dataset.textColor = "";
            node.dataset.textFontFamily = "";
            node.dataset.textFontSize = "12";
            node.className = `absolute ${widthClass} ${shapeClass} ${extraClass} border p-0 cursor-move`;
            node.style.zIndex = "9";
            node.innerHTML = `
                <div class="absolute -top-3 left-6 font-label-md text-label-md text-accent-db">
                    <span data-node-title>${title}</span>
                </div>
                <span class="hidden" data-node-subtitle>${subtitle}</span>
            `;
            return node;
        }

        node.dataset.nodeIcon = icon;
        node.dataset.nodeIconSet = "material";
        node.dataset.textColor = "";
        node.dataset.textFontFamily = "";
        node.dataset.textFontSize = tool === "text" ? "20" : "20";
        node.dataset.nodeOpacity = "100";
        node.dataset.nodeIconPosition = "top";
        node.className = `absolute ${widthClass} bg-surface-white border border-outline-variant ${shapeClass} shadow-md p-4 flex flex-col items-center justify-center gap-2 cursor-move z-10`;
        node.innerHTML = `
            <div class="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-1">
                <span class="material-symbols-outlined text-[20px]" data-node-icon-element>${icon}</span>
            </div>
            <h3 class="font-title-md text-title-md text-on-surface text-center" data-node-title>${title}</h3>
            <p class="font-label-md text-label-md text-on-surface-variant text-center" data-node-subtitle>${subtitle}</p>
        `;
        return node;
    };

    const placeNodeAtPoint = (node, point, { recordHistory = true } = {}) => {
        if (recordHistory) {
            saveHistory();
        }
        diagramStage.appendChild(node);
        const offsetLeft = node.offsetWidth / 2;
        const offsetTop = node.offsetHeight / 2;
        node.style.left = `${Math.max(24, point.x - offsetLeft)}px`;
        node.style.top = `${Math.max(24, point.y - offsetTop)}px`;
        bindNodeInteractions(node);
        syncNodeGroupMembership(node);
        setSelectedNode(node);
    };

    const createNodeAtPointer = (event) => {
        if (!isInsertNodeTool(activeTool)) {
            return;
        }
        const point = getStagePoint(event);
        const node = createNodeMarkup(activeTool === "shape" ? selectedShapeInsertTool() : activeTool);
        placeNodeAtPoint(node, point);
        activeTool = "select";
        syncToolButtons();
    };

    zoomInButton?.addEventListener("click", () => {
        currentScale = Math.min(2, Number((currentScale + 0.1).toFixed(2)));
        applyScale();
    });

    zoomOutButton?.addEventListener("click", () => {
        currentScale = Math.max(0.5, Number((currentScale - 0.1).toFixed(2)));
        applyScale();
    });

    const closeShapeMenu = () => {
        shapeMenu?.classList.add("hidden");
    };

    const closeLineMenu = () => {
        lineMenu?.classList.add("hidden");
    };

    const isShapeMenuOpen = () => Boolean(shapeMenu && !shapeMenu.classList.contains("hidden"));

    const isLineMenuOpen = () => Boolean(lineMenu && !lineMenu.classList.contains("hidden"));

    const openShapeMenu = () => {
        if (!(shapeMenu instanceof HTMLElement) || !(shapeToolButton instanceof HTMLElement)) {
            return;
        }
        shapeMenuButtons.forEach((button) => {
            const isActive = button.dataset.shapeTool === selectedShapeTool;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        shapeMenu.classList.remove("hidden");
    };

    const openLineMenu = () => {
        if (!(lineMenu instanceof HTMLElement) || !(lineToolButton instanceof HTMLElement)) {
            return;
        }
        lineMenuButtons.forEach((button) => {
            const isActive = button.dataset.linePreset === selectedLinePreset;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
        lineMenu.classList.remove("hidden");
    };

    toolButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (button === shapeToolButton) {
                activeTool = "shape";
                syncToolButtons();
                closeLineMenu();
                if (isShapeMenuOpen()) {
                    closeShapeMenu();
                } else {
                    openShapeMenu();
                }
                return;
            }
            if (button === lineToolButton) {
                activeTool = "connector";
                syncToolButtons();
                closeShapeMenu();
                if (isLineMenuOpen()) {
                    closeLineMenu();
                } else {
                    openLineMenu();
                }
                return;
            }
            closeShapeMenu();
            closeLineMenu();
            activeTool = button.dataset.diagramTool ?? "select";
            syncToolButtons();
        });
    });

    shapeMenuButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            selectedShapeTool = button.dataset.shapeTool || "rectangle";
            activeTool = "shape";
            closeShapeMenu();
            closeLineMenu();
            syncShapeToolButton();
            syncToolButtons();
        });
    });

    lineMenuButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            selectedLinePreset = button.dataset.linePreset || "straight-arrow";
            activeTool = "connector";
            closeLineMenu();
            syncToolButtons();
        });
    });

    syncShapeToolButton();

    document.addEventListener("pointerdown", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        if (event.target.closest("#diagram-shape-menu, #diagram-shape-tool")) {
            return;
        }
        closeShapeMenu();
    });

    document.addEventListener("pointerdown", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        if (event.target.closest("#diagram-line-menu, #diagram-line-tool")) {
            return;
        }
        closeLineMenu();
    });

    propertiesPanel?.addEventListener("pointerdown", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("button, input, select")) {
            beginPropertyEditHistory();
            if (event.target.closest("button")) {
                window.setTimeout(endPropertyEditHistory, 0);
            }
        }
    }, true);

    propertiesPanel?.addEventListener("beforeinput", beginPropertyEditHistory, true);
    propertiesPanel?.addEventListener("focusout", endPropertyEditHistory, true);
    propertiesPanel?.addEventListener("change", endPropertyEditHistory, true);

    let isPanning = false;
    let isSelecting = false;
    let selectionStart = null;
    let selectionBox = null;
    let selectionMoved = false;
    let suppressCanvasClick = false;
    let drawingShape = null;
    let drawingLine = null;
    let suppressShapeClick = false;
    let startX = 0;
    let startY = 0;

    const syncDrawingShape = (node, start, end) => {
        const area = normalizeBox(start, end);
        const width = Math.max(1, area.width);
        const height = Math.max(1, area.height);
        node.style.left = `${area.x}px`;
        node.style.top = `${area.y}px`;
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
    };

    zoomLayer.addEventListener("mousedown", (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]") && !isCanvasMoveTool() && !isConnectorTool()) {
            return;
        }
        if (isDrawingNodeTool(activeTool) && event.button === 0) {
            const point = getStagePoint(event);
            const tool = activeTool === "shape" ? selectedShapeInsertTool() : activeTool;
            const node = createNodeMarkup(tool);
            saveHistory();
            node.classList.add("diagram-node-drawing");
            diagramStage.appendChild(node);
            syncDrawingShape(node, point, point);
            drawingShape = {
                node,
                tool: activeTool,
                start: point,
                moved: false
            };
            clearSelectedNode();
            event.preventDefault();
            return;
        }
        if (activeTool === "connector" && event.button === 0) {
            const svg = diagramStage.querySelector("svg");
            if (!(svg instanceof SVGElement)) {
                return;
            }
            const point = getStagePoint(event);
            const sourceNode = event.target instanceof HTMLElement
                ? event.target.closest("[data-diagram-node]")
                : null;
            const sourceAnchorHit = sourceNode instanceof HTMLElement
                ? getClosestAnchorHit(sourceNode, point)
                : null;
            const startPoint = sourceAnchorHit?.anchorPoint ?? point;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
            saveHistory();
            line.dataset.lineFrom = sourceNode instanceof HTMLElement ? (sourceNode.dataset.nodeKey ?? "") : "";
            line.dataset.lineTo = "";
            if (sourceNode instanceof HTMLElement && sourceAnchorHit) {
                line.dataset.fromAnchor = sourceAnchorHit.anchor;
            } else {
                line.dataset.freeStartX = String(startPoint.x);
                line.dataset.freeStartY = String(startPoint.y);
            }
            line.dataset.freeEndX = String(startPoint.x);
            line.dataset.freeEndY = String(startPoint.y);
            line.dataset.lineOffsetX = "0";
            line.dataset.lineOffsetY = "0";
            line.dataset.lineControlX = "0";
            line.dataset.lineControlY = "0";
            applySelectedLinePreset(line);
            svg.appendChild(line);
            linePaths.push(line);
            bindLineInteractions(line);
            setSelectedLine(line);
            drawingLine = {
                line,
                start: startPoint,
                sourceNodeKey: sourceNode instanceof HTMLElement ? (sourceNode.dataset.nodeKey ?? "") : "",
                targetNode: null,
                targetAnchor: "",
                moved: false
            };
            if (sourceNode instanceof HTMLElement && sourceAnchorHit) {
                showLineConnectPoints(sourceNode, sourceAnchorHit.anchor);
            }
            updateLinePaths();
            event.preventDefault();
            return;
        }
        if (!isSelectionTool() && !isCanvasMoveTool()) {
            return;
        }

        if ((isCanvasMoveTool() && event.button === 0) || event.altKey || event.button === 1) {
            isPanning = true;
            isTemporaryMoveActive = !isCanvasMoveTool();
            startX = event.clientX;
            startY = event.clientY;
            startStagePanX = stagePanX;
            startStagePanY = stagePanY;
            zoomLayer.style.cursor = "grabbing";
            syncToolButtons();
            event.preventDefault();
            return;
        }

        if (event.button !== 0) {
            return;
        }

        isSelecting = true;
        selectionMoved = false;
        selectionStart = getStagePoint(event);
        selectionBox = createSelectionBox();
        syncSelectionBox(selectionBox, normalizeBox(selectionStart, selectionStart));
        startX = event.clientX;
        startY = event.clientY;
        event.preventDefault();
    });

    window.addEventListener("mousemove", (event) => {
        if (lineDrag) {
            const point = getStagePoint(event);
            const deltaX = point.x - lineDrag.start.x;
            const deltaY = point.y - lineDrag.start.y;
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                lineDrag.changed = true;
            }
            if (lineDrag.mode === "endpoint-start" || lineDrag.mode === "endpoint-end") {
                const originNode = diagramRoot.querySelector(`[data-node-key="${lineDrag.originNodeKey}"]`);
                if (!lineDrag.hasLeftOriginNode && originNode instanceof HTMLElement) {
                    const originAnchorPoint = getAnchorPoint(originNode, lineDrag.originAnchor);
                    if (Math.hypot(originAnchorPoint.x - point.x, originAnchorPoint.y - point.y) > lineConnectAnchorAttachRadius) {
                        lineDrag.hasLeftOriginNode = true;
                    }
                }
                const excludedKeys = [
                    !lineDrag.hasLeftOriginNode ? lineDrag.originNodeKey : "",
                    lineDrag.oppositeNodeKey
                ].filter(Boolean);
                lineDrag.point = point;
                lineDrag.pointerPoint = point;
                clearLineConnectTargets();
                lineDrag.targetNode = findNodeAtPoint(point, excludedKeys);
                if (lineDrag.targetNode) {
                    const anchorHit = getClosestAnchorHit(lineDrag.targetNode, point);
                    lineDrag.targetAnchor = anchorHit.anchor;
                    lineDrag.shouldAttach = anchorHit.distance <= lineConnectAnchorAttachRadius;
                    if (lineDrag.shouldAttach) {
                        lineDrag.point = anchorHit.anchorPoint;
                    }
                    showLineConnectPoints(lineDrag.targetNode, lineDrag.targetAnchor);
                } else {
                    if (!lineDrag.hasLeftOriginNode && originNode instanceof HTMLElement) {
                        const anchorHit = getClosestAnchorHit(originNode, point);
                        lineDrag.targetAnchor = anchorHit.anchor;
                        lineDrag.shouldAttach = anchorHit.anchor !== lineDrag.originAnchor
                            && anchorHit.distance <= lineConnectAnchorAttachRadius;
                        if (lineDrag.shouldAttach) {
                            lineDrag.targetNode = originNode;
                            lineDrag.point = anchorHit.anchorPoint;
                        }
                        showLineConnectPoints(originNode, lineDrag.targetAnchor);
                    } else {
                        lineDrag.targetAnchor = "";
                        lineDrag.shouldAttach = false;
                    }
                }
            } else if (lineDrag.mode === "control") {
                lineDrag.line.dataset.lineControlX = String(lineDrag.controlX + deltaX);
                lineDrag.line.dataset.lineControlY = String(lineDrag.controlY + deltaY);
                if (lineDrag.line.dataset.lineType !== "elbow") {
                    lineDrag.line.dataset.lineType = "curve";
                }
            } else {
                lineDrag.line.dataset.lineOffsetX = String(lineDrag.offsetX + deltaX);
                lineDrag.line.dataset.lineOffsetY = String(lineDrag.offsetY + deltaY);
                if (lineDrag.line.dataset.freeStartX && lineDrag.line.dataset.freeStartY) {
                    lineDrag.line.dataset.freeStartX = String(lineDrag.freeStartX + deltaX);
                    lineDrag.line.dataset.freeStartY = String(lineDrag.freeStartY + deltaY);
                }
                if (lineDrag.line.dataset.freeEndX && lineDrag.line.dataset.freeEndY) {
                    lineDrag.line.dataset.freeEndX = String(lineDrag.freeEndX + deltaX);
                    lineDrag.line.dataset.freeEndY = String(lineDrag.freeEndY + deltaY);
                }
            }
            updateLinePaths();
            updateLineSelectionPanel(lineDrag.line);
            return;
        }

        if (isFrameResizing && selectedNode && frameResizeStartBox) {
            resizeNodeFromCorner(selectedNode, frameResizeCorner, frameResizeStartBox, getStagePoint(event));
            frameResizeChanged = true;
            if (selectedNode.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(selectedNode);
            } else {
                syncGroupedNodeHighlights(selectedNode);
            }
            updateLinePaths();
            syncSelectionFrame();
            return;
        }

        if (frameRotation) {
            const { node, center, angle, rotation } = frameRotation;
            const point = getStagePoint(event);
            const delta = Math.atan2(point.y - center.y, point.x - center.x) - angle;
            let degrees = rotation + delta * 180 / Math.PI;
            if (event.shiftKey) degrees = Math.round(degrees / 15) * 15;
            node.dataset.rotation = String((degrees % 360 + 360) % 360);
            node.style.transform = `rotate(${getNodeRotation(node)}deg)`;
            frameRotation.changed = true;
            updateLinePaths();
            syncSelectionFrame();
            return;
        }

        if (drawingShape) {
            const currentPoint = getStagePoint(event);
            const area = normalizeBox(drawingShape.start, currentPoint);
            drawingShape.moved = area.width > 4 || area.height > 4;
            syncDrawingShape(drawingShape.node, drawingShape.start, currentPoint);
            if (drawingShape.tool === "group-box") {
                syncGroupedNodeHighlights(drawingShape.node);
            }
            return;
        }

        if (drawingLine) {
            const currentPoint = getStagePoint(event);
            const targetNode = findNodeAtPoint(currentPoint, drawingLine.sourceNodeKey ? [drawingLine.sourceNodeKey] : []);
            const anchorHit = targetNode ? getClosestAnchorHit(targetNode, currentPoint) : null;
            const shouldAttach = Boolean(targetNode && anchorHit && anchorHit.distance <= lineConnectAnchorAttachRadius);
            const endPoint = shouldAttach && anchorHit ? anchorHit.anchorPoint : currentPoint;
            drawingLine.targetNode = shouldAttach ? targetNode : null;
            drawingLine.targetAnchor = shouldAttach && anchorHit ? anchorHit.anchor : "";
            drawingLine.line.dataset.freeEndX = String(endPoint.x);
            drawingLine.line.dataset.freeEndY = String(endPoint.y);
            drawingLine.moved = Math.hypot(currentPoint.x - drawingLine.start.x, currentPoint.y - drawingLine.start.y) > 4;
            clearLineConnectTargets();
            if (targetNode && anchorHit) {
                showLineConnectPoints(targetNode, anchorHit.anchor);
            }
            if (drawingLine.line.dataset.lineType === "curve") {
                const deltaX = endPoint.x - drawingLine.start.x;
                const deltaY = endPoint.y - drawingLine.start.y;
                const length = Math.max(1, Math.hypot(deltaX, deltaY));
                const bend = Math.max(32, Math.min(120, length * 0.25));
                drawingLine.line.dataset.lineControlX = String(-deltaY / length * bend);
                drawingLine.line.dataset.lineControlY = String(deltaX / length * bend);
            }
            updateLinePaths();
            return;
        }

        if (isSelecting && selectionStart && selectionBox) {
            const currentPoint = getStagePoint(event);
            const area = normalizeBox(selectionStart, currentPoint);
            selectionMoved = area.width > 4 || area.height > 4;
            syncSelectionBox(selectionBox, area);
            if (selectionMoved) {
                const nodes = getNodes().filter((node) => isNodeInsideBox(node, area));
                setSelectedNodes(nodes);
            }
            return;
        }

        if (isPanning) {
            suppressCanvasClick = true;
            stagePanX = startStagePanX + (event.clientX - startX);
            stagePanY = startStagePanY + (event.clientY - startY);
            applyScale();
        }
    });

    window.addEventListener("mouseup", (event) => {
        if (lineDrag) {
            const completedLineDrag = lineDrag;
            if (
                (lineDrag.mode === "endpoint-start" || lineDrag.mode === "endpoint-end")
            ) {
                const point = lineDrag.pointerPoint ?? getStagePoint(event);
                const excludedKeys = [
                    !lineDrag.hasLeftOriginNode ? lineDrag.originNodeKey : "",
                    lineDrag.oppositeNodeKey
                ].filter(Boolean);
                let targetNode = lineDrag.targetNode ?? findNodeAtPoint(point, excludedKeys);
                let anchorHit = targetNode ? getClosestAnchorHit(targetNode, point) : null;
                if (!targetNode && !lineDrag.hasLeftOriginNode) {
                    const originNode = diagramRoot.querySelector(`[data-node-key="${lineDrag.originNodeKey}"]`);
                    const originAnchorHit = originNode instanceof HTMLElement
                        ? getClosestAnchorHit(originNode, point)
                        : null;
                    if (
                        originNode instanceof HTMLElement
                        && originAnchorHit
                        && originAnchorHit.anchor !== lineDrag.originAnchor
                        && originAnchorHit.distance <= lineConnectAnchorAttachRadius
                    ) {
                        targetNode = originNode;
                        anchorHit = originAnchorHit;
                    }
                }
                if (targetNode && anchorHit && (lineDrag.shouldAttach || anchorHit.distance <= lineConnectAnchorAttachRadius)) {
                    const targetKey = targetNode.dataset.nodeKey ?? "";
                    const targetAnchor = lineDrag.targetAnchor || anchorHit.anchor;
                    if (lineDrag.mode === "endpoint-start") {
                        lineDrag.line.dataset.lineFrom = targetKey;
                        lineDrag.line.dataset.fromAnchor = targetAnchor;
                        delete lineDrag.line.dataset.freeStartX;
                        delete lineDrag.line.dataset.freeStartY;
                    } else {
                        lineDrag.line.dataset.lineTo = targetKey;
                        lineDrag.line.dataset.toAnchor = targetAnchor;
                        delete lineDrag.line.dataset.freeEndX;
                        delete lineDrag.line.dataset.freeEndY;
                    }
                    lineDrag.line.dataset.lineOffsetX = "0";
                    lineDrag.line.dataset.lineOffsetY = "0";
                    updateLineSelectionPanel(lineDrag.line);
                    if (selectedNodeName) {
                        selectedNodeName.textContent = `${lineDrag.line.dataset.lineFrom ?? ""} -> ${lineDrag.line.dataset.lineTo ?? ""}`;
                    }
                } else if (lineDrag.mode === "endpoint-start") {
                    lineDrag.line.dataset.freeStartX = String(point.x);
                    lineDrag.line.dataset.freeStartY = String(point.y);
                    lineDrag.line.dataset.lineOffsetX = "0";
                    lineDrag.line.dataset.lineOffsetY = "0";
                } else {
                    lineDrag.line.dataset.freeEndX = String(point.x);
                    lineDrag.line.dataset.freeEndY = String(point.y);
                    lineDrag.line.dataset.lineOffsetX = "0";
                    lineDrag.line.dataset.lineOffsetY = "0";
                }
            }
            if (completedLineDrag.changed && completedLineDrag.historyState) {
                pushHistoryState(completedLineDrag.historyState);
            }
            lineDrag = null;
            clearLineConnectTargets();
            document.body.style.userSelect = "";
            updateLinePaths();
            suppressCanvasClick = true;
        }

        if (isFrameResizing) {
            if (frameResizeChanged && frameResizeHistoryState) {
                pushHistoryState(frameResizeHistoryState);
            }
            isFrameResizing = false;
            frameResizeStartBox = null;
            frameResizeHistoryState = null;
            frameResizeChanged = false;
            document.body.style.userSelect = "";
            syncSelectionFrame();
        }

        if (frameRotation) {
            if (frameRotation.changed && frameRotation.historyState) {
                pushHistoryState(frameRotation.historyState);
            }
            frameRotation = null;
            selectionFrame?.querySelector("[data-node-rotate-handle]")?.classList.remove("is-rotating");
            document.body.style.userSelect = "";
            suppressCanvasClick = true;
        }

        if (drawingShape) {
            const { node, start, moved } = drawingShape;
            if (!moved) {
                node.classList.remove("diagram-node-drawing");
                node.style.width = "";
                node.style.height = "";
                placeNodeAtPoint(node, start, { recordHistory: false });
            } else {
                node.classList.remove("diagram-node-drawing");
                bindNodeInteractions(node);
                if (node.dataset.nodeKind === "group-box") {
                    getNodes().forEach((item) => {
                        if (item.dataset.nodeKind !== "group-box") {
                            syncNodeGroupMembership(item);
                        }
                    });
                    syncGroupedNodeHighlights(node);
                } else {
                    syncNodeGroupMembership(node);
                }
                setSelectedNode(node);
            }
            drawingShape = null;
            suppressShapeClick = true;
            activeTool = "select";
            syncToolButtons();
        }

        if (drawingLine) {
            const { line, moved } = drawingLine;
            if (!moved) {
                lineHitPaths.get(line)?.remove();
                lineHandleGroups.get(line)?.remove();
                lineBadges.get(line)?.remove();
                line.remove();
                linePaths = linePaths.filter((item) => item !== line);
                clearSelectedLine();
            } else {
                if (drawingLine.targetNode && drawingLine.targetAnchor) {
                    line.dataset.lineTo = drawingLine.targetNode.dataset.nodeKey ?? "";
                    line.dataset.toAnchor = drawingLine.targetAnchor;
                    delete line.dataset.freeEndX;
                    delete line.dataset.freeEndY;
                    line.dataset.lineOffsetX = "0";
                    line.dataset.lineOffsetY = "0";
                }
                setSelectedLine(line);
            }
            drawingLine = null;
            suppressCanvasClick = true;
            activeTool = "select";
            syncToolButtons();
            clearLineConnectTargets();
            updateLinePaths();
        }

        if (isSelecting) {
            if (!selectionMoved) {
                clearSelectedNode();
            } else {
                suppressCanvasClick = true;
            }
            selectionBox?.remove();
            selectionBox = null;
            selectionStart = null;
            isSelecting = false;
        }
        isPanning = false;
        isTemporaryMoveActive = false;
        syncToolButtons();
    });

    zoomLayer.addEventListener("click", (event) => {
        if (suppressShapeClick) {
            suppressShapeClick = false;
            return;
        }
        if (suppressCanvasClick) {
            suppressCanvasClick = false;
            return;
        }
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]")) {
            return;
        }
        if (isSelectionTool()) {
            clearSelectedNode();
        }
        createNodeAtPointer(event);
    });

    zoomLayer.addEventListener("wheel", (event) => {
        if (!event.ctrlKey) {
            return;
        }
        event.preventDefault();
        currentScale = event.deltaY < 0
            ? Math.min(2, Number((currentScale + 0.1).toFixed(2)))
            : Math.max(0.5, Number((currentScale - 0.1).toFixed(2)));
        applyScale();
    }, { passive: false });

    const handleDiagramShortcut = (event) => {
        if (isTypingTarget(event.target)) {
            return false;
        }
        const activeNodes = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);

        if (isCopyKeyEvent(event) && activeNodes.length) {
            event.preventDefault();
            copySelectedNodes();
            return true;
        }

        if ((event.ctrlKey || event.metaKey) && (event.key?.toLowerCase() === "z" || event.code === "KeyZ")) {
            event.preventDefault();
            undoLastHistory();
            return true;
        }

        if (isPasteKeyEvent(event) && nodeClipboard.length) {
            event.preventDefault();
            pasteCopiedNodes();
            return true;
        }

        if (!activeNodes.length && !selectedLine) {
            return false;
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            deleteSelectedNodes();
            return true;
        }

        const step = event.shiftKey ? 10 : 2;
        let deltaX = 0;
        let deltaY = 0;

        if (event.key === "ArrowUp") {
            deltaY = -step;
        } else if (event.key === "ArrowDown") {
            deltaY = step;
        } else if (event.key === "ArrowLeft") {
            deltaX = -step;
        } else if (event.key === "ArrowRight") {
            deltaX = step;
        } else {
            return false;
        }

        event.preventDefault();
        saveHistory();
        moveNodesByDelta(activeNodes, deltaX, deltaY);
        return true;
    };

    document.addEventListener("keydown", handleDiagramShortcut, true);

    document.addEventListener("copy", (event) => {
        if (isTypingTarget(event.target)) {
            return;
        }
        if (copySelectedNodes()) {
            event.preventDefault();
        }
    });

    document.addEventListener("paste", (event) => {
        if (isTypingTarget(event.target)) {
            return;
        }
        if (pasteCopiedNodes()) {
            event.preventDefault();
        }
    });

    getNodes().forEach((node) => {
        normalizeNodeIcon(node);
        bindNodeInteractions(node);
    });
    linePaths.forEach(bindLineInteractions);

    nodeLabelInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        const titleElement = selectedNode.querySelector("[data-node-title]");
        if (titleElement) {
            titleElement.textContent = nodeLabelInput.value;
        }
        if (selectedNodeName) {
            selectedNodeName.textContent = nodeLabelInput.value;
        }
        updateLinePaths();
    });

    textColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode) {
                return;
            }
            selectedNode.dataset.textColor = button.dataset.textColor ?? "";
            applyNodeTextAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    textColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(textColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.textColor = textColorPicker.value;
        applyNodeTextAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    textFontFamilyInput?.addEventListener("change", () => {
        if (!selectedNode || !(textFontFamilyInput instanceof HTMLSelectElement)) {
            return;
        }
        selectedNode.dataset.textFontFamily = textFontFamilyInput.value;
        textFontFamilyInput.style.fontFamily = textFontFamilyInput.value;
        applyNodeTextAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    textFontSizeInput?.addEventListener("input", () => {
        if (!selectedNode || !(textFontSizeInput instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.textFontSize = textFontSizeInput.value;
        applyNodeTextAppearance(selectedNode);
        if (textFontSizeValue) {
            textFontSizeValue.textContent = `${textFontSizeInput.value}px`;
        }
        updateLinePaths();
    });

    nodeBadgeInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        selectedNode.dataset.nodeBadgeText = nodeBadgeInput.value.trim();
        syncNodeBadge(selectedNode);
        syncSelectionFrame();
    });

    badgePositionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.badgePosition) {
                return;
            }
            selectedNode.dataset.nodeBadgePosition = button.dataset.badgePosition;
            syncNodeBadge(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    badgeColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.badgeColor) {
                return;
            }
            selectedNode.dataset.nodeBadgeColor = button.dataset.badgeColor;
            syncNodeBadge(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    badgeColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(badgeColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.nodeBadgeColor = badgeColorPicker.value;
        syncNodeBadge(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    ensureLineTypeOptions();

    lineTypeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineType) {
                return;
            }
            selectedLine.dataset.lineType = button.dataset.lineType;
            updateLinePaths();
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineDashButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineDash) {
                return;
            }
            selectedLine.dataset.lineDash = button.dataset.lineDash;
            applyLineAppearance(selectedLine);
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineColor) {
                return;
            }
            selectedLine.dataset.lineColor = button.dataset.lineColor;
            applyLineAppearance(selectedLine);
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineColorPicker?.addEventListener("input", () => {
        if (!selectedLine || !(lineColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedLine.dataset.lineColor = lineColorPicker.value;
        applyLineAppearance(selectedLine);
        updateLineSelectionPanel(selectedLine);
    });

    lineAnimatedInput?.addEventListener("change", () => {
        if (!selectedLine || !(lineAnimatedInput instanceof HTMLInputElement)) {
            return;
        }
        selectedLine.dataset.lineAnimated = String(lineAnimatedInput.checked);
        applyLineAppearance(selectedLine);
    });

    lineStartArrowButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineStartArrow) {
                return;
            }
            selectedLine.dataset.lineStartArrow = button.dataset.lineStartArrow;
            applyLineAppearance(selectedLine);
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineEndArrowButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineEndArrow) {
                return;
            }
            selectedLine.dataset.lineEndArrow = button.dataset.lineEndArrow;
            applyLineAppearance(selectedLine);
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineMotionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine) {
                return;
            }
            if (button.dataset.lineMotion === "none") {
                selectedLine.dataset.lineAnimated = "false";
            } else if (button.dataset.lineAnimationDirection) {
                selectedLine.dataset.lineAnimated = "true";
                selectedLine.dataset.lineAnimationDirection = button.dataset.lineAnimationDirection;
            }
            applyLineAppearance(selectedLine);
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineBadgeInput?.addEventListener("input", () => {
        if (!selectedLine || !(lineBadgeInput instanceof HTMLInputElement)) {
            return;
        }
        selectedLine.dataset.lineBadgeText = lineBadgeInput.value.trim();
        updateLinePaths();
        updateLineSelectionPanel(selectedLine);
    });

    lineBadgeColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedLine || !button.dataset.lineBadgeColor) {
                return;
            }
            selectedLine.dataset.lineBadgeColor = button.dataset.lineBadgeColor;
            updateLinePaths();
            updateLineSelectionPanel(selectedLine);
        });
    });

    lineBadgeColorPicker?.addEventListener("input", () => {
        if (!selectedLine || !(lineBadgeColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedLine.dataset.lineBadgeColor = lineBadgeColorPicker.value;
        updateLinePaths();
        updateLineSelectionPanel(selectedLine);
    });

    iconPositionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.iconPosition) {
                return;
            }
            selectedNode.dataset.nodeIconPosition = button.dataset.iconPosition;
            applyNodeIconPosition(selectedNode);
            updateSelectionPanel(selectedNode);
            syncSelectionFrame();
            updateLinePaths();
        });
    });

    fillColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.fillColor) {
                return;
            }
            selectedNode.dataset.fillColor = button.dataset.fillColor;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    fillColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(fillColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.fillColor = fillColorPicker.value;
        applyNodeAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    strokeColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.strokeColor) {
                return;
            }
            selectedNode.dataset.strokeColor = button.dataset.strokeColor;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    strokeColorPicker?.addEventListener("input", () => {
        if (!selectedNode || !(strokeColorPicker instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.strokeColor = strokeColorPicker.value;
        applyNodeAppearance(selectedNode);
        updateSelectionPanel(selectedNode);
    });

    strokeWidthInput?.addEventListener("input", () => {
        if (!selectedNode) {
            return;
        }
        selectedNode.dataset.strokeWidth = strokeWidthInput.value;
        applyNodeAppearance(selectedNode);
        if (strokeWidthValue) {
            strokeWidthValue.textContent = `${strokeWidthInput.value}px`;
        }
    });

    nodeOpacityInput?.addEventListener("input", () => {
        if (!selectedNode || !(nodeOpacityInput instanceof HTMLInputElement)) {
            return;
        }
        selectedNode.dataset.nodeOpacity = nodeOpacityInput.value;
        applyNodeAppearance(selectedNode);
        if (nodeOpacityValue) {
            nodeOpacityValue.textContent = `${nodeOpacityInput.value}%`;
        }
    });

    strokeStyleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!selectedNode || !button.dataset.strokeStyle) {
                return;
            }
            selectedNode.dataset.strokeStyle = button.dataset.strokeStyle;
            applyNodeAppearance(selectedNode);
            updateSelectionPanel(selectedNode);
        });
    });

    spaceGroups.forEach(bindGroupInteractions);

    const initialDiagramButton = diagramRoot.querySelector("[data-space-diagram].bg-secondary\\/10")
        ?? diagramRoot.querySelector("[data-space-diagram]");
    if (initialDiagramButton instanceof HTMLElement) {
        setActiveDiagramButton(initialDiagramButton);
    }

    if (spacesAction instanceof HTMLElement && spacesScroll instanceof HTMLElement) {
        spacesAction.addEventListener("click", () => {
            const group = document.createElement("div");
            group.dataset.spaceGroup = "";
            group.dataset.groupExpanded = "true";
            group.className = "group";
            group.innerHTML = `
                <div class="flex items-center gap-2" data-space-group-header>
                    <button class="flex-1 flex items-center gap-2 px-2 py-1.5 text-on-surface hover:bg-surface-variant/50 rounded-lg transition-colors text-left"
                            data-spaces-row
                            data-group-toggle
                            type="button">
                        <span class="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200" data-spaces-expander>expand_more</span>
                        <span class="material-symbols-outlined text-[18px] text-accent-api" data-spaces-primary-icon>folder</span>
                        <span class="font-body-md text-body-md flex-1 truncate font-medium" data-spaces-text data-group-name>New Group ${groupCounter++}</span>
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-variant/60 rounded-lg transition-colors"
                            data-group-add-diagram
                            title="Add diagram"
                            type="button">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                    </button>
                </div>
                <div class="pl-9 pr-2 py-1 space-y-1" data-spaces-children></div>
            `;
            spacesScroll.appendChild(group);
            bindGroupInteractions(group);
            if (spacesPanel.classList.contains("w-0")) {
                setSpacesHidden(false);
            }
        });
    }

    const openIconPicker = () => {
        if (!selectedNode || !(iconLibraryPanel instanceof HTMLElement)) {
            return;
        }
        iconLibraryNode = selectedNode;
        draftIcon = nodeIconState(selectedNode);
        const iconElement = ensureNodeIconElement(selectedNode);
        originalIconSnapshot = {
            icon: { ...draftIcon },
            hidden: iconElement?.classList.contains("hidden") ?? true,
            wrapperHidden: getNodeIconWrap(selectedNode, iconElement)?.classList.contains("hidden") ?? false,
            inlineColor: iconElement?.style.color || ""
        };
        iconColorModeTouched = false;
        activeIconCategory = draftIcon.set === "remix" ? draftIcon.category : "all";
        activeIconGroup = "all";
        if (iconSearchInput instanceof HTMLInputElement) {
            iconSearchInput.value = "";
        }
        iconLibraryTabs.forEach((button) => {
            const isActive = button.dataset.iconCategory === activeIconCategory;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-selected", String(isActive));
        });
        syncDraftIconControls();
        renderIconServiceGroups();
        renderIconOptions();
        iconLibraryPanel.classList.remove("hidden");
        iconLibraryPanel.classList.add("is-open");
        iconPickerTrigger.setAttribute("aria-expanded", "true");
        window.setTimeout(() => iconSearchInput?.focus(), 0);
    };

    iconPickerTrigger?.addEventListener("click", () => {
        if (iconLibraryPanel?.classList.contains("hidden")) {
            openIconPicker();
        } else {
            closeIconPicker();
        }
    });

    iconSearchInput?.addEventListener("input", () => {
        renderIconOptions(iconSearchInput instanceof HTMLInputElement ? iconSearchInput.value : "");
    });

    iconSearchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeIconPicker();
            iconPickerTrigger?.focus();
        }
    });

    const bindHorizontalWheelScroll = (element) => {
        element?.addEventListener("wheel", (event) => {
            if (element.scrollWidth <= element.clientWidth || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
                return;
            }
            event.preventDefault();
            element.scrollLeft += event.deltaY;
        }, { passive: false });
    };
    bindHorizontalWheelScroll(iconLibraryTabList);
    bindHorizontalWheelScroll(iconServiceGroups);

    iconServiceGroups?.addEventListener("click", (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }
        const button = event.target.closest("[data-icon-group]");
        if (!(button instanceof HTMLElement)) {
            return;
        }
        activeIconGroup = button.dataset.iconGroup || "all";
        renderIconServiceGroups();
        iconServiceGroups.querySelector(`[data-icon-group="${activeIconGroup}"]`)?.scrollIntoView({
            behavior: "smooth", block: "nearest", inline: "nearest"
        });
        renderIconOptions(iconSearchInput instanceof HTMLInputElement ? iconSearchInput.value : "");
    });

    iconGrid?.addEventListener("click", (event) => {
        if (!iconLibraryNode || !(event.target instanceof HTMLElement)) {
            return;
        }
        const option = event.target.closest("[data-icon-index]");
        if (!(option instanceof HTMLElement)) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const icon = diagramIcons[Number(option.dataset.iconIndex)];
        if (!icon) {
            return;
        }
        const colorMode = iconColorModeTouched
            ? draftIcon?.colorMode || "original"
            : (iconLibraryNode.dataset.nodeIconColorMode === "inherit"
                ? "default"
                : (iconLibraryNode.dataset.nodeIconColorMode || "default"));
        draftIcon = {
            ...icon,
            colorMode,
            originalColor: icon.color,
            customColor: draftIcon?.customColor || "#006399",
            inheritColor: originalIconSnapshot?.icon.inheritColor || "#45464D"
        };
        previewNodeIcon(iconLibraryNode, draftIcon);
        syncDraftIconControls();
        renderIconOptions(iconSearchInput instanceof HTMLInputElement ? iconSearchInput.value : "");
    });

    iconColorModeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!draftIcon || !iconLibraryNode || !button.dataset.iconColorMode) {
                return;
            }
            iconColorModeTouched = true;
            draftIcon.colorMode = button.dataset.iconColorMode;
            previewNodeIcon(iconLibraryNode, draftIcon);
            syncDraftIconControls();
        });
    });

    iconCustomColorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!draftIcon || !iconLibraryNode || !button.dataset.iconCustomColor) {
                return;
            }
            iconColorModeTouched = true;
            draftIcon.colorMode = "custom";
            draftIcon.customColor = button.dataset.iconCustomColor;
            previewNodeIcon(iconLibraryNode, draftIcon);
            syncDraftIconControls();
        });
    });

    iconCustomColorPicker?.addEventListener("input", () => {
        if (!draftIcon || !iconLibraryNode || !(iconCustomColorPicker instanceof HTMLInputElement)) {
            return;
        }
        iconColorModeTouched = true;
        draftIcon.colorMode = "custom";
        draftIcon.customColor = iconCustomColorPicker.value;
        previewNodeIcon(iconLibraryNode, draftIcon);
        syncDraftIconControls();
    });

    iconLibraryTabs.forEach((button) => {
        button.addEventListener("click", () => {
            activeIconCategory = button.dataset.iconCategory || "all";
            activeIconGroup = "all";
            iconLibraryTabs.forEach((item) => {
                const isActive = item === button;
                item.classList.toggle("active", isActive);
                item.setAttribute("aria-selected", String(isActive));
            });
            button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            renderIconServiceGroups();
            renderIconOptions(iconSearchInput instanceof HTMLInputElement ? iconSearchInput.value : "");
        });
    });

    iconLibraryApply?.addEventListener("click", () => {
        if (!iconLibraryNode || !draftIcon) {
            return;
        }
        setNodeIcon(iconLibraryNode, draftIcon);
        if (selectedNode === iconLibraryNode) {
            updateSelectionPanel(iconLibraryNode);
        }
        closeIconPicker({ restore: false });
        iconPickerTrigger?.focus();
    });

    const cancelIconSelection = () => {
        closeIconPicker();
        iconPickerTrigger?.focus();
    };
    iconLibraryClose?.addEventListener("click", cancelIconSelection);
    iconLibraryCancel?.addEventListener("click", cancelIconSelection);
    iconLibraryPanel?.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            cancelIconSelection();
        }
    });

    propertiesCloseButton?.addEventListener("click", () => {
        clearSelectedNode();
    });

    propertyTabs.forEach((button) => {
        button.addEventListener("click", () => {
            setActivePropertyTab(button.dataset.propertyTab ?? "text");
        });
    });

    setPropertiesPanelVisible(false);
    setActivePropertyTab("text");
    applyScale();
    syncToolButtons();
    updateLinePaths();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDiagramPage);
} else {
    initializeDiagramPage();
}
