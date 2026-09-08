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
    const toolButtons = Array.from(diagramRoot.querySelectorAll("[data-diagram-tool]"));
    const selectedNodeName = document.getElementById("diagram-selected-node-name");
    const selectedNodeType = document.getElementById("diagram-selected-node-type");
    const selectedNodeIcon = document.getElementById("diagram-selected-node-icon");
    const selectedNodeIconWrap = document.getElementById("diagram-selected-node-icon-wrap");
    const propertiesPanel = document.getElementById("diagram-properties-panel");
    const propertiesCloseButton = document.getElementById("diagram-properties-close");
    const propertyTabs = Array.from(diagramRoot.querySelectorAll("[data-property-tab]"));
    const propertyPanels = Array.from(diagramRoot.querySelectorAll("[data-property-panel]"));
    const nodeLabelInput = document.getElementById("diagram-node-label-input");
    const nodeBadgeInput = document.getElementById("diagram-node-badge-input");
    const badgePositionButtons = Array.from(diagramRoot.querySelectorAll("[data-badge-position]"));
    const badgeColorValue = document.getElementById("diagram-badge-color-value");
    const badgeColorButtons = Array.from(diagramRoot.querySelectorAll("[data-badge-color]"));
    const badgeColorPicker = document.getElementById("diagram-badge-color-picker");
    const linePaths = Array.from(diagramRoot.querySelectorAll("[data-line-from][data-line-to]"));
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
    const strokeStyleButtons = Array.from(diagramRoot.querySelectorAll("[data-stroke-style]"));
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
        diagramStage.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
        if (zoomValue) {
            zoomValue.textContent = `${Math.round(currentScale * 100)}%`;
        }
    };

    const syncToolButtons = () => {
        toolButtons.forEach((button) => {
            const isActive = button.dataset.diagramTool === activeTool;
            button.classList.toggle("text-secondary", isActive);
            button.classList.toggle("bg-secondary/10", isActive);
            button.classList.toggle("text-on-surface-variant", !isActive);
        });
        zoomLayer.style.cursor = activeTool === "select" ? "grab" : "copy";
    };

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
        const nodeKind = node.dataset.nodeKind ?? "node";
        const icon = nodeIconState(node);
        const panelTypeLabel = nodeKind === "group-box" ? "Selected Group" : "Selected Node";
        const panelIcon = icon.name
            ? icon
            : { category: "default", set: "material", name: nodeKind === "group-box" ? "dashboard_customize" : "block", label: "아이콘 없음" };
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

    const setSelectedNodes = (nodes) => {
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
        getNodes().forEach((item) => item.classList.remove("diagram-node-selected"));
        getNodes().forEach((item) => item.classList.remove("diagram-node-grouped-highlight"));
        getNodes().forEach(applyNodeAppearance);
        syncSelectionFrame();
        setPropertiesPanelVisible(false);
    };

    const deleteSelectedNodes = () => {
        const nodesToDelete = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (!nodesToDelete.length) {
            return false;
        }

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

    const applyNodeAppearance = (node) => {
        const fillColor = node.dataset.fillColor ?? "#CDE5FF";
        const strokeColor = node.dataset.strokeColor ?? (node.dataset.nodeKind === "group-box" ? "#8FD5B7" : "#C6C6CD");
        const strokeWidth = node.dataset.strokeWidth ?? "2";
        const strokeStyle = node.dataset.strokeStyle ?? "solid";
        const hasVisibleStroke = strokeColor !== "transparent" && Number(strokeWidth) > 0;

        node.style.backgroundColor = fillColor;
        node.style.borderWidth = hasVisibleStroke ? `${strokeWidth}px` : "0px";
        node.style.borderColor = strokeColor;
        node.style.borderStyle = hasVisibleStroke ? strokeStyle : "solid";
        node.style.boxShadow = hasVisibleStroke ? "" : "none";
    };

    const ensureResizeHandle = (node) => {
        node.querySelectorAll("[data-node-resize-handle]").forEach((handle) => handle.remove());
    };

    const getNodeRotation = (node) => Number(node.dataset.rotation ?? 0)
        + (node.dataset.shapeType === "diamond" ? 45 : 0);

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

    const getNodeMinimumSize = (node) => {
        return logic.nodeMinimumSize(node.dataset.nodeKind, node.dataset.shapeType);
    };

    const resizeNodeFromCorner = (node, corner, startBox, currentPoint) => {
        const min = getNodeMinimumSize(node);
        const nextBox = logic.resizeRotatedBox(startBox, corner, currentPoint, min, {
            preserveAspect: node.dataset.shapeType === "circle"
        }, getNodeRotation(node));

        node.style.left = `${nextBox.left}px`;
        node.style.top = `${nextBox.top}px`;
        node.style.width = `${nextBox.width}px`;
        node.style.height = `${nextBox.height}px`;
    };

    let isFrameResizing = false;
    let frameResizeCorner = "se";
    let frameResizeStartBox = null;
    let frameRotation = null;

    window.addEventListener("blur", () => {
        if (!frameRotation && !isFrameResizing) return;
        frameRotation = null;
        isFrameResizing = false;
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
            if (event.button !== 0 || activeTool !== "select" || !selectedNode) return;
            const center = { x: selectedNode.offsetLeft + selectedNode.offsetWidth / 2, y: selectedNode.offsetTop + selectedNode.offsetHeight / 2 };
            const point = getStagePoint(event);
            frameRotation = {
                node: selectedNode,
                center,
                angle: Math.atan2(point.y - center.y, point.x - center.x),
                rotation: Number(selectedNode.dataset.rotation ?? 0)
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
                if (activeTool !== "select" || !selectedNode) {
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

            if (!(fromNode instanceof HTMLElement) || !(toNode instanceof HTMLElement)) {
                path.removeAttribute("d");
                path.style.display = "none";
                return;
            }
            path.style.display = "";

            const start = getAnchorPoint(fromNode, path.dataset.fromAnchor || "bottom");
            const end = getAnchorPoint(toNode, path.dataset.toAnchor || "top");
            const deltaX = end.x - start.x;
            const deltaY = end.y - start.y;

            const fromAnchor = path.dataset.fromAnchor || "bottom";
            const toAnchor = path.dataset.toAnchor || "top";

            let pathValue = "";
            if ((fromAnchor === "right" && toAnchor === "left") || (fromAnchor === "left" && toAnchor === "right")) {
                const midX = start.x + deltaX / 2;
                pathValue = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
            } else if ((fromAnchor === "bottom" && toAnchor === "top") || (fromAnchor === "top" && toAnchor === "bottom")) {
                const midY = start.y + deltaY / 2;
                pathValue = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
            } else {
                const controlY1 = start.y + deltaY * 0.45;
                const controlY2 = end.y - deltaY * 0.45;
                pathValue = `M ${start.x} ${start.y} C ${start.x} ${controlY1}, ${end.x} ${controlY2}, ${end.x} ${end.y}`;
            }

            path.setAttribute("d", pathValue);
        });
    };

    const bindNodeInteractions = (node) => {
        const element = node;
        if (element.dataset.bound === "true") {
            return;
        }
        element.dataset.bound = "true";
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

        element.addEventListener("mousedown", (event) => {
            if (activeTool !== "select") {
                return;
            }
            if (event.target instanceof HTMLElement && event.target.closest("[data-node-resize-handle]")) {
                return;
            }
            isDragging = true;
            hasDragged = false;
            startX = event.clientX;
            startY = event.clientY;

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
            } else if (!selectedNodes.includes(element)) {
                setSelectedNode(element);
            }

            dragSnapshots = (selectedNodes.includes(element) ? selectedNodes : [element]).map((node) => ({
                element: node,
                initialLeft: node.offsetLeft,
                initialTop: node.offsetTop
            }));

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
            if (isDragging && dragSnapshots.length) {
                dragSnapshots.forEach((item) => {
                    if (item.element.dataset.nodeKind !== "group-box") {
                        syncNodeGroupMembership(item.element);
                    }
                });
            }
            isDragging = false;
            document.body.style.userSelect = "";
            if (!hasDragged && element.dataset.nodeKind !== "group-box") {
                syncNodeGroupMembership(element);
            }
            dragSnapshots = [];
            syncSelectionFrame();
        });
    };

    const shapeTools = ["rectangle", "circle", "diamond"];
    const isShapeTool = (tool) => shapeTools.includes(tool);

    const createNodeMarkup = (tool) => {
        const node = document.createElement("div");
        node.dataset.diagramNode = "";
        node.dataset.nodeKey = `generated-${tool}-${++nodeCounter}`;

        if (tool === "rectangle" || tool === "circle" || tool === "diamond") {
            const title = tool === "rectangle"
                ? "Rectangle"
                : (tool === "circle" ? "Circle" : "Diamond");
            const shapeClass = tool === "rectangle"
                ? "diagram-shape-rectangle w-40 h-28"
                : (tool === "circle" ? "diagram-shape-circle w-32 h-32" : "diagram-shape-diamond w-28 h-28");

            node.dataset.nodeKind = "shape";
            node.dataset.shapeType = tool;
            node.dataset.nodeIcon = "";
            node.dataset.fillColor = "#FFFFFF";
            node.dataset.strokeColor = "#C6C6CD";
            node.dataset.strokeWidth = "2";
            node.dataset.strokeStyle = "solid";
            node.dataset.textColor = "";
            node.dataset.textFontFamily = "";
            node.dataset.textFontSize = "20";
            node.className = `absolute ${shapeClass} bg-surface-white border border-outline-variant shadow-sm cursor-move z-10`;
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
            extraClass = "h-[180px] border-accent-db/20 bg-accent-db/5 border-dashed z-0 items-start justify-start";
        }

        if (tool === "group-box") {
            node.dataset.nodeKind = "group-box";
            node.dataset.nodeIcon = "database";
            node.dataset.nodeIconSet = "material";
            node.dataset.fillColor = "rgba(16, 185, 129, 0.05)";
            node.dataset.strokeColor = "#8FD5B7";
            node.dataset.strokeWidth = "1";
            node.dataset.strokeStyle = "dashed";
            node.dataset.textColor = "";
            node.dataset.textFontFamily = "";
            node.dataset.textFontSize = "12";
            node.className = `absolute ${widthClass} ${shapeClass} ${extraClass} border p-0 cursor-move`;
            node.innerHTML = `
                <div class="absolute -top-3 left-6 bg-surface-container-low px-2 font-label-md text-label-md text-accent-db flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]" data-node-icon-element>database</span>
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

    const placeNodeAtPoint = (node, point) => {
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
        if (activeTool === "select") {
            return;
        }
        const point = getStagePoint(event);
        const node = createNodeMarkup(activeTool);
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

    toolButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeTool = button.dataset.diagramTool ?? "select";
            syncToolButtons();
        });
    });

    let isPanning = false;
    let isSelecting = false;
    let selectionStart = null;
    let selectionBox = null;
    let selectionMoved = false;
    let suppressCanvasClick = false;
    let drawingShape = null;
    let suppressShapeClick = false;
    let startX = 0;
    let startY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;

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
        if (event.target instanceof HTMLElement && event.target.closest("[data-diagram-node]")) {
            return;
        }
        if (isShapeTool(activeTool) && event.button === 0) {
            const point = getStagePoint(event);
            const node = createNodeMarkup(activeTool);
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
        if (activeTool !== "select") {
            return;
        }

        if (event.altKey || event.button === 1) {
            isPanning = true;
            startX = event.clientX;
            startY = event.clientY;
            initialScrollLeft = zoomLayer.scrollLeft;
            initialScrollTop = zoomLayer.scrollTop;
            zoomLayer.style.cursor = "grabbing";
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
        if (isFrameResizing && selectedNode && frameResizeStartBox) {
            resizeNodeFromCorner(selectedNode, frameResizeCorner, frameResizeStartBox, getStagePoint(event));
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
            updateLinePaths();
            syncSelectionFrame();
            return;
        }

        if (drawingShape) {
            const currentPoint = getStagePoint(event);
            const area = normalizeBox(drawingShape.start, currentPoint);
            drawingShape.moved = area.width > 4 || area.height > 4;
            syncDrawingShape(drawingShape.node, drawingShape.start, currentPoint);
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
            zoomLayer.scrollLeft = initialScrollLeft - (event.clientX - startX);
            zoomLayer.scrollTop = initialScrollTop - (event.clientY - startY);
        }
    });

    window.addEventListener("mouseup", () => {
        if (isFrameResizing) {
            isFrameResizing = false;
            frameResizeStartBox = null;
            document.body.style.userSelect = "";
            syncSelectionFrame();
        }

        if (frameRotation) {
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
                placeNodeAtPoint(node, start);
            } else {
                node.classList.remove("diagram-node-drawing");
                bindNodeInteractions(node);
                syncNodeGroupMembership(node);
                setSelectedNode(node);
            }
            drawingShape = null;
            suppressShapeClick = true;
            activeTool = "select";
            syncToolButtons();
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
        if (activeTool === "select") {
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

    window.addEventListener("keydown", (event) => {
        const activeNodes = selectedNodes.length ? selectedNodes : (selectedNode ? [selectedNode] : []);
        if (!activeNodes.length) {
            return;
        }
        if (event.target instanceof HTMLElement) {
            const tagName = event.target.tagName.toLowerCase();
            if (tagName === "input" || tagName === "textarea" || event.target.isContentEditable) {
                return;
            }
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            deleteSelectedNodes();
            return;
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
            return;
        }

        event.preventDefault();
        moveNodesByDelta(activeNodes, deltaX, deltaY);
    });

    getNodes().forEach((node) => {
        normalizeNodeIcon(node);
        bindNodeInteractions(node);
    });

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
