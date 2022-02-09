import { inject, injectable, } from 'inversify';
import { ServiceIdentifiers } from '../../container/ServiceIdentifiers';

import * as ESTree from 'estree';

import { IVisitor } from '../../interfaces/node-transformers/IVisitor';
import { IOptions } from '../../interfaces/options/IOptions';
import { IRandomGenerator } from '../../interfaces/utils/IRandomGenerator';

import { NodeTransformationStage } from '../../enums/node-transformers/NodeTransformationStage';

import { AbstractNodeTransformer } from '../AbstractNodeTransformer';
import { NodeGuards } from '../../node/NodeGuards';
import { NodeType } from '../../enums/node/NodeType';


@injectable()
export class SubstitutionTransformer extends AbstractNodeTransformer {

    /**
     * @param {IRandomGenerator} randomGenerator
     * @param {IOptions} options
     */
     public constructor (
        @inject(ServiceIdentifiers.IRandomGenerator) randomGenerator: IRandomGenerator,
        @inject(ServiceIdentifiers.IOptions) options: IOptions
    ) {
        super(randomGenerator, options);
    }

    private static flipOperator (operator: '+' | '-'): '+' | '-' {
        if (operator === '+') {
            return '-';
        } else {
            return '+';
        }
    }

    private static flipExpression (expression: ESTree.Literal | ESTree.UnaryExpression): ESTree.Literal | ESTree.UnaryExpression {
        if (NodeGuards.isLiteralNode(expression)) {
            return {
                type: NodeType.UnaryExpression,
                operator: '-',
                argument: expression,
                prefix: true,
                metadata: { ignoredNode: false }
            };
        } else {
            if (expression.operator === '+') {
                expression.operator = '-';
                
                return expression;
            } else {
                return SubstitutionTransformer.flipExpression(<ESTree.Literal | ESTree.UnaryExpression>expression.argument);
            }
        }
    }

    private static isNumericLiteral (node: ESTree.Node): node is ESTree.Literal | ESTree.UnaryExpression {
        if (NodeGuards.isLiteralNode(node)) {
            return typeof node.value === 'number';
        } else if (NodeGuards.isUnaryExpressionNode(node)) {
            return (node.operator === '+' || node.operator === '-') && SubstitutionTransformer.isNumericLiteral(node.argument);
        }

        return false;
    }

    public getVisitor (nodeTransformationStage: NodeTransformationStage): IVisitor | null {
        switch (nodeTransformationStage) {
            case NodeTransformationStage.Substitution:
                return {
                    leave: (node: ESTree.Node, parentNode: ESTree.Node | null): ESTree.Node | undefined => {
                        if (parentNode && NodeGuards.isBinaryExpressionNode(node)) {
                            return this.transformNode(node, parentNode);
                        }
                    }
                };
            
            default:
                return null;
        }
    }

    public transformNode (node: ESTree.BinaryExpression, parentNode: ESTree.Node): ESTree.Node {
        if (node.operator === '+' || node.operator === '-') {
            if (SubstitutionTransformer.isNumericLiteral(node.right)) {
                node.operator = SubstitutionTransformer.flipOperator(node.operator);
                node.right = SubstitutionTransformer.flipExpression(node.right);
            }
        }

        return node;
    }
}
