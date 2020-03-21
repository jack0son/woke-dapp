import root from './root';
import authentication from "./authentication";
import claim from './claim';

const stages = { root, authentication, claim };

const toEnum = (stageList) => {
	const byName = {};
	stageList.forEach((stage, i) => byName[stage] = i);
	return byName;
}

const initial = {
	root: 0,
	authentication: 0,
	claim: 0,
};

const stageConfig = {};
Object.keys(stages).forEach(name => {
	stageConfig[name] = {
		list: stages[name],
		byName: toEnum(stages[name]),
		initial: initial[name],
	}
})

// Set initial stages, using name or index
// See design/stages/<name>.js for available stages
stageConfig.root.initial = stageConfig.root.byName.AUTH;
stageConfig.authentication.initial = stageConfig.authentication.byName.SIGNIN;
stageConfig.claim.initial = stageConfig.claim.byName.READY;

export default stageConfig;
