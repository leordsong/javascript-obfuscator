import { ContainerModule, interfaces } from 'inversify';
import { ServiceIdentifiers } from '../../ServiceIdentifiers';

import { INodeTransformer } from '../../../interfaces/node-transformers/INodeTransformer';

import { NodeTransformer } from '../../../enums/node-transformers/NodeTransformer';

import { SubstitutionTransformer } from '../../../node-transformers/substitution-transformers/SubstitutionTransformer';

export const substitutionTransformersModule: interfaces.ContainerModule = new ContainerModule((bind: interfaces.Bind) => {
    bind<INodeTransformer>(ServiceIdentifiers.INodeTransformer)
        .to(SubstitutionTransformer)
        .whenTargetNamed(NodeTransformer.SubstitutionTransformer);
});
