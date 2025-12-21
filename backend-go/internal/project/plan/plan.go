package plan

type PlanName string

const (
	PlanFree      PlanName = "free"
	PlanPro       PlanName = "pro"
	PlanEnterprise PlanName = "enterprise"
)

var PLAN_LIMITS = map[PlanName]int{
	PlanFree:      1,
	PlanPro:       10,
	PlanEnterprise: 999999, // effectively unlimited
}

func GetProjectLimit(plan PlanName) int {
	if limit, ok := PLAN_LIMITS[plan]; ok {
		return limit
	}
	return PLAN_LIMITS[PlanFree]
}

func CanCreateProject(plan PlanName, currentCount int) bool {
	limit := GetProjectLimit(plan)
	if limit >= 999999 {
		return true
	}
	return currentCount < limit
}

